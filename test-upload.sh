#!/bin/bash

echo "Testing EPI X-Ray Backend - End-to-End Flow"
echo "==========================================="
echo ""

API_URL="http://localhost:5000/api"
CSV_FILE="sample-data/order-to-cash-events.csv"

echo "Step 1: Uploading CSV file..."
UPLOAD_RESPONSE=$(curl -s -X POST \
  -F "file=@${CSV_FILE}" \
  -F "processName=Order to Cash - Test" \
  ${API_URL}/upload)

echo "Upload Response:"
echo $UPLOAD_RESPONSE | jq '.'
echo ""

PROCESS_ID=$(echo $UPLOAD_RESPONSE | jq -r '.process.id')

if [ "$PROCESS_ID" == "null" ] || [ -z "$PROCESS_ID" ]; then
  echo "❌ Upload failed! No process ID returned."
  exit 1
fi

echo "✅ Upload successful! Process ID: $PROCESS_ID"
echo ""

echo "Step 2: Analyzing process (running process mining algorithms)..."
ANALYZE_RESPONSE=$(curl -s -X POST ${API_URL}/processes/${PROCESS_ID}/analyze)

echo "Analysis Response:"
echo $ANALYZE_RESPONSE | jq '.'
echo ""

echo "Step 3: Fetching process details..."
PROCESS_RESPONSE=$(curl -s ${API_URL}/processes/${PROCESS_ID})

echo "Process Details:"
echo $PROCESS_RESPONSE | jq '.process | {id, name, activities: (.activities | length), eventLogs: (.eventLogs | length), automationOpportunities: (.automationOpportunities | length)}'
echo ""

echo "Step 4: Fetching performance metrics..."
METRICS_RESPONSE=$(curl -s "${API_URL}/analytics/performance?processId=${PROCESS_ID}")

echo "Performance Metrics:"
echo $METRICS_RESPONSE | jq '.'
echo ""

echo "Step 5: Fetching automation opportunities..."
AUTO_RESPONSE=$(curl -s "${API_URL}/analytics/automation?processId=${PROCESS_ID}")

echo "Automation Opportunities:"
echo $AUTO_RESPONSE | jq '.opportunities[] | {taskName, automationPotential, frequency}'
echo ""

echo "=========================================="
echo "✅ End-to-End Test Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Process ID: $PROCESS_ID"
echo "- Events Imported: $(echo $UPLOAD_RESPONSE | jq '.eventsImported')"
echo "- Activities Discovered: $(echo $PROCESS_RESPONSE | jq '.process.activities | length')"
echo "- Automation Opportunities: $(echo $AUTO_RESPONSE | jq '.opportunities | length')"
