---
name: Google Sheets Booking Setup
overview: Set up a Google Sheet for booking data sync by creating a Google Cloud service account, configuring credentials, and adding them to the production environment.
todos:
  - id: create-gcp-account
    content: Create Google Cloud service account and download JSON credentials
    status: completed
  - id: create-spreadsheet
    content: Create 'Revure Bookings' spreadsheet and share with service account
    status: completed
  - id: encode-credentials
    content: Base64 encode the credentials JSON file
    status: completed
  - id: configure-env
    content: Add GOOGLE_SHEETS_CREDENTIALS and BOOKING_SPREADSHEET_ID to EC2 .env
    status: completed
  - id: init-headers
    content: Run ensureBookingSheetHeaders() to create column headers
    status: completed
  - id: restart-verify
    content: Restart PM2 and verify sync works with a test booking
    status: completed
---

# Google Sheets Booking Integration Setup

This plan walks through setting up Google Sheets integration to automatically sync booking data.

## Step 1: Create Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Sheets API**:

- Go to APIs & Services > Library
- Search "Google Sheets API" and enable it

4. Create a Service Account:

- Go to APIs & Services > Credentials
- Click "Create Credentials" > "Service Account"
- Name it (e.g., `revure-booking-sync`)
- Download the JSON credentials file

## Step 2: Create the Bookings Spreadsheet

1. Create a new Google Sheet named "Revure Bookings"
2. Share it with the service account email (found in the JSON credentials as `client_email`, e.g., `revure-booking-sync@project.iam.gserviceaccount.com`)
3. Give it **Editor** access
4. Copy the Spreadsheet ID from the URL:
   ```javascript
               https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
               
   https://docs.google.com/spreadsheets/d/1sr0PK5Taa_zvBADzJ3RwSEANPvsEBNIGpiMNiqDuqlc/edit?gid=0#gid=0
   ```




## Step 3: Encode Credentials

Convert the JSON credentials to base64 for environment variable:

```bash
base64 -i path/to/credentials.json | tr -d '\n'
```



## Step 4: Configure Production Environment

SSH into EC2 and add environment variables to `/var/www/revure-backend/.env`:

```bash
# Google Sheets for Bookings
GOOGLE_SHEETS_CREDENTIALS=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiY29oZXNpdmUtYm9sdC00ODI3MTItYTEiLAogICJwcml2YXRlX2tleV9pZCI6ICIwYTdhNjY4NjlmY2MxNTFkYWY0YWNkNjNkZWI1MmU3YzcxM2RkYzU2IiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdlFJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLY3dnZ1NqQWdFQUFvSUJBUUNxQ1VjY2pYZWNTYkVBXG4ybHpEK21ZSndyUDFDQTBmelBWWm9WdEU4aCt5TXNKSlBNa0IxQWtZdGtjZmdqMGF4M3JvRDdJd2o1NjM3MzdrXG5iVTREVnBWMWM2cGxhWVFNc1lSbXRYRFcyU2JsLy9VZklFbm16TnlGNkV0WHVyK0JvUUhDY0lkNE9vbGtWbGZKXG42MjRBRGdGc0RUVnJNaHpwUUpvNjZ2QVBRWmtrODQ0RnoxQmI2bzdZbThaSlRLSC8vWmpXeEV3ZmN2TVVnMHUzXG5Nd21lV1ErcnpUQTNuR1ZZSTJwK3o1dWFSSnNyK0wzaStrM3JBZXVxbm5vQmxDLzJBTlhTWXFEQkZKKzZxYlhmXG43UThaVS91enVnQ1V6anNlNG56bVVESWNEbFMwOHgrMjJDaEJYaGR4VVRhWlhaSFoyTGRwSnNuNFY2QmNEa3dCXG5IeU9pejJRQkFnTUJBQUVDZ2dFQUJGRDRPY2F6RGJmMnF1eUFISmIxZ21PcmhRbXphSlpmdDRyZnFkNUNGUGhTXG5JNEVNSXJSZTF6NWdTNUhYS24vOEZCbzY1aDN0TStMYjNDRlVzTVBBeDBLY2haYkNPLzdCRzBqWmtKQ2lXc1lPXG5zeit5OUkySWZ3czBwMmxWalcwNGdkYXdyNm4vdlJqdWdWRU5RYW5aV2lSek1kR0x0NVdVM0xCRVVBVFVwZ0lRXG5wWXRSbnZxMWx2Z2g0ZnNjYTdWa2VPdXllREZVMWVLZ09oaDREUmRaTC96aThIdUpwb2xERUN2Umk2OWRLUzcwXG5ZSVRZZVgxS3JTNXowaTZJcFJQZFZJaWhoSmZ3TTAxRkpwK0RxZGR4b3hzSmpZLzNiVGtBMkI5YjRqSHgxckNNXG5Fak9ka201UDl5K3RLNVpmczhDb0ZWTFRwa2ZyU3RzLzkwa2tiM0UvbVFLQmdRRFUxdEJqcDJTL0RRaklZU24yXG5pbkZoQW9MdTVyZ0c3UWFrZE9RUll6azF1WWhhSDMxZXZQVEFoNThkNUlxWEgvZE1VY2twa2pCY0RNaWJURUFLXG5iUDI3aXMvNHB0dGEvalF3N3lySXJ2clZsSnBKWHNCZ3RCa1NYcjJrWWltUm80V2Y5WGdiWWNXcW9NWEVFNzlyXG5kODZUcTJOZStNeFJSZmlGeFNUeHJ4WHFtUUtCZ1FETWhHeVkxU3ZxV2NPdDdkUjVsMUNaa252Uk9lbzNubUtTXG5rUUh5N3BwNGdkM210dHBSRjZXWk9OdG1hbVdLS242bnBCK2VxMHZWRHpUZkt5V1YvRmdudlpZU2twcU5pdVVOXG5QTlBacnF5T084dTY0NUlzVkY2UzlpNTQ4YVRsY0pVR2lUTC9mM1Q0c1VqNVF2LzBVRk9hd0gxRmpOV3VCdDBUXG56ZElKWkRQTnFRS0JnUURRWTg4L2N6c2lFRG9FTDVZdGpObDcyVUNuZG9EQ1R6ck10S0pGSC9oNDBNSmZNeXZHXG5JWTRtSCtPOEdmTlVDbmxRWVZkcmUzWWIrbXhFR1lFdWRBNXVuSGdLQmgwSjE1RDBSSWVJWEVLOThiU3FsN29XXG5OTi9EYTcyVWdJUWcwNUZXejdtY1hidHkxOTBxb1Fjdnl1c1pESnJMOXgvZGgzdlFSZmxwSlR0NUtRS0JnRk9vXG5kNk9zejJIMWhnM0hrM3FKWXZidTdLY1JRYld1bkRQSURUd0tUald0S2RBT1RBK1AxTFZ3aEk3SVJ2RFZvU21DXG5BVTB1Vkw2NmthNFlRQyt5SVgxZ0Y5dFJETmVKVVZpdzRSZlNVOU42c2tPb2cwcU8ySURWSXYxbUcwV2ZYOVprXG5tTy9hZTBhZmZuSTM3ZXRLVUdpbEJKbEdtc0d0SFJIVXgyNEFCeERCQW9HQUdwTVd6MzZiQUVSYmFPTDRVczN3XG5iZ3p4YnU4NXpEeFBpTTlEUlg4MkhhNWtvVFpENmRvZ2Iyd1VTQmdJeFVibjY3aFNES0dkMkRyemNBM09MZU44XG5XV2ZXcU5SeWVmS25rYUYzc2lWNm9YQzBJY1NnekdFUXE0RHMzQlZtUm52WnVlZGlaUmVlY1d4TGk2ekoyRnpGXG5ETHo0SGlmaVFISUR5R3htZlR0MUhiWT1cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJyZXZ1cmUtYm9va2luZy1zeW5jQGNvaGVzaXZlLWJvbHQtNDgyNzEyLWExLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAiY2xpZW50X2lkIjogIjExMDQ5MzE5NjA5ODkxNDgwMzk3MCIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvcmV2dXJlLWJvb2tpbmctc3luYyU0MGNvaGVzaXZlLWJvbHQtNDgyNzEyLWExLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAidW5pdmVyc2VfZG9tYWluIjogImdvb2dsZWFwaXMuY29tIgp9Cg==%           
BOOKING_SPREADSHEET_ID=1sr0PK5Taa_zvBADzJ3RwSEANPvsEBNIGpiMNiqDuqlc
BOOKING_SHEET_NAME=Bookings
```



## Step 5: Initialize Sheet Headers

Run the header initialization script on EC2:

```bash
cd /var/www/revure-backend
node -e "require('./src/utils/googleSheetsService').ensureBookingSheetHeaders().then(console.log)"
```



## Step 6: Restart and Verify

Restart PM2 and test by creating a booking:

```bash
pm2 restart revure-backend
```

---