import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os 
from dotenv import load_dotenv 
import boto3 

# --- Load Environment Variables ---
load_dotenv() 

# --- Configuration Variables ---
# Firebase Config
# C:/Users/Derek/Service Accounts/truth-discord-bot-firebase-adminsdk-fbsvc-217931e6cb.json
SERVICE_ACCOUNT_KEY_PATH = "C:\\Users\\Derek\\Service Accounts\\truth-discord-bot-firebase-adminsdk-fbsvc-217931e6cb.json"
COLLECTION_NAME = "discord-channels"

# DynamoDB Config
DYNAMODB_TABLE_NAME = "truth-discord-info"
AWS_REGION = 'us-east-2' # e.g., 'us-east-1', 'eu-west-1' - IMPORTANT: Set your AWS region
# AWS credentials will be loaded from .env automatically by boto3 or explicitly below
DB_KEY_ID = os.getenv("db_key_id")
DB_SECRET_ACCESS_KEY = os.getenv("db_secret_access_key")

# --- Initialize Firebase ---
try:
    # Use standard spaces instead of non-breaking spaces (\xa0)
    cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase initialized successfully.")
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    print("Please ensure 'SERVICE_ACCOUNT_KEY_PATH' is correct and the file exists.")
    exit()

# --- Initialize DynamoDB Client ---
try:
    # Use standard spaces instead of non-breaking spaces (\xa0)
    if DB_KEY_ID and DB_SECRET_ACCESS_KEY:
        dynamodb = boto3.resource(
            'dynamodb',
            region_name=AWS_REGION,
            aws_access_key_id=DB_KEY_ID,
            aws_secret_access_key=DB_SECRET_ACCESS_KEY
        )
        dynamodb_table = dynamodb.Table(DYNAMODB_TABLE_NAME)
        # Test connection by trying to get table info
        dynamodb_table.load()
        print(f"DynamoDB table '{DYNAMODB_TABLE_NAME}' initialized successfully in region '{AWS_REGION}'.")
    else:
        print("Warning: DB_KEY_ID or DB_SECRET_ACCESS_KEY not found in .env. Attempting to use default AWS credential chain.")
        dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
        dynamodb_table = dynamodb.Table(DYNAMODB_TABLE_NAME)
        dynamodb_table.load() # Test connection
        print(f"DynamoDB table '{DYNAMODB_TABLE_NAME}' initialized successfully using default credentials in region '{AWS_REGION}'.")

except Exception as e:
    print(f"Error initializing DynamoDB: {e}")
    print("Please ensure 'AWS_REGION' is correct and your AWS credentials (DB_KEY_ID, DB_SECRET_ACCESS_KEY in .env, or default chain) are valid for DynamoDB access.")
    exit()


# --- Function to pull data from DynamoDB ---
def get_data_from_dynamodb(table):
    """
    Scans the DynamoDB table and returns the items.
    """
    print(f"Fetching data from DynamoDB table: {table.name}...")
    try:
        response = table.scan()
        items = response['Items']

        # Handle pagination if your table has many items
        while 'LastEvaluatedKey' in response:
            print("Fetching more items (paginated results)...")
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response['Items'])
        print(f"Successfully fetched {len(items)} items from DynamoDB.")
        return items
    except Exception as e:
        print(f"Error fetching data from DynamoDB: {e}")
        return []

# --- Function to upload DynamoDB data to Firestore ---
def upload_dynamodb_to_firestore(dynamodb_items, collection_name):
    """
    Uploads DynamoDB items to a Firestore collection.
    
    Uses the DynamoDB 'id' (the primary key for the configuration) 
    as the Firestore document ID and includes 'channelId' as a separate field.
    """
    print(f"\nAttempting to upload {len(dynamodb_items)} items from DynamoDB to Firestore collection '{collection_name}'...")
    uploaded_count = 0
    for index, item in enumerate(dynamodb_items):
        # 1. Use the DynamoDB ID (assumed to be 'id') as the Firestore document ID and the new field.
        # NOTE: If your DynamoDB primary key is named differently, you MUST change 'id' below to match.
        guild_id_doc_id = str(item.get('id', '')).strip() 
        
        # 2. Extract remaining fields (channelId is now just a field)
        channel_id_value = str(item.get('channelId', '')).strip()
        name_value = str(item.get('name', '')).strip()
        
        # Validate that the necessary keys are present (Guild ID is now required for the document ID)
        if guild_id_doc_id and channel_id_value and name_value:
            document_data = {
                'guildId': guild_id_doc_id, # Field: new document ID (Guild ID)
                'channelId': channel_id_value, # Field: old document ID (Channel ID)
                'name': name_value,
                'created_on': firestore.SERVER_TIMESTAMP
            }

            try:
                # Use .document(guild_id_doc_id).set() to explicitly set the document ID
                db.collection(collection_name).document(guild_id_doc_id).set(document_data)
                print(f"Uploaded document with ID (Guild ID) '{guild_id_doc_id}' (channel: '{channel_id_value}')")
                uploaded_count += 1
            except Exception as e:
                print(f"Error uploading document for Guild ID '{guild_id_doc_id}' (DynamoDB item {index+1}): {e}")
        else:
            # Updated skip message to reflect the new primary requirement
            print(f"Skipping DynamoDB item {index+1} due to missing or empty required fields (Guild ID, Channel ID, or Name). Item data: {item}")

    print(f"\nDynamoDB to Firestore upload complete. Total documents uploaded: {uploaded_count}")

# --- Main execution ---
if __name__ == "__main__":
    # 1. Fetch data from DynamoDB
    dynamodb_data = get_data_from_dynamodb(dynamodb_table)

    # 2. Upload to Firestore
    if dynamodb_data:
        upload_dynamodb_to_firestore(dynamodb_data, COLLECTION_NAME)
    else:
        print("No data fetched from DynamoDB. Nothing to upload to Firestore.")
