import functions_framework
# Using the explicit import path for the DatastoreAdminClient to avoid module pathing issues.
# This is the most reliable way to access the Admin API for backups.
from google.cloud.datastore_admin_v1 import DatastoreAdminClient 
from datetime import datetime

# NOTE: The DatastoreAdminClient is part of the 'google-cloud-datastore' library.
# If you receive an ImportError, ensure your environment is clean and run: 
# pip install google-cloud-datastore

# --- Configuration ---
# Your Google Cloud Project ID
PROJECT_ID = "truth-discord-bot" 
# The Cloud Storage bucket where backups will be stored (gs://<BUCKET_NAME>)
BUCKET_NAME = "discord-channels-backups" 
# Collections to include in the backup. List them explicitly for safety.
COLLECTION_IDS = ['discord-channels'] # Only backing up the discord-channels collection by default.

@functions_framework.http
def scheduled_firestore_backup(request):
    """
    HTTP Cloud Function triggered by Cloud Scheduler to initiate a full 
    Firestore Managed Export to a Google Cloud Storage bucket.
    
    Requires the 'Cloud Datastore Import Export Admin' and 'Storage Object Admin' roles.
    """
    print(f"Starting Firestore export for project: {PROJECT_ID}")
    
    try:
        # Initialize the Datastore Admin Client using the explicit class
        client = DatastoreAdminClient()
        
        # 1. Define the output URI prefix (path to the storage bucket)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Example output_url_prefix: gs://discord-channels-backups/20251027_110000
        output_url_prefix = f"gs://{BUCKET_NAME}/{timestamp}" 

        # 2. Initiate the asynchronous export operation
        # FIX: The request is now structured EXACTLY as required by the Datastore Admin API documentation 
        # (project_id, output_url_prefix, and entity_filter).
        operation = client.export_entities(
            # The parent field (which was causing the previous errors) is replaced 
            # by passing the 'project_id' inside the structured request object.
            request={
                'project_id': PROJECT_ID,
                'output_url_prefix': output_url_prefix,
                'entity_filter': {
                    # In Datastore, collections are referred to as 'kinds'.
                    'kinds': COLLECTION_IDS 
                }
            }
        )

        print(f"Export operation started successfully. Target URI: {output_url_prefix}")
        print(f"Operation Name: {operation.operation.name}")
        
        return f"Firestore backup initiated at {timestamp} to {output_url_prefix}", 200

    except Exception as e:
        error_message = f"FATAL ERROR: Failed to initiate Firestore backup. Details: {e}"
        print(error_message)
        return error_message, 500
