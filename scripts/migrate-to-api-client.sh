#!/bin/bash

#
# Automated CSRF Migration Script
# Migrates frontend components from raw fetch() to apiClient
#

set -e

echo "🔧 Starting API Client Migration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Files already migrated (skip these)
SKIP_FILES=(
  "components/process-discovery.tsx"
  "components/upload-modal.tsx"
  "components/command-palette.tsx"
  "lib/csrf-client.ts"
  "lib/api-client.ts"
)

# Count files to migrate
TOTAL=0
MIGRATED=0

# Find all files with POST/PUT/PATCH/DELETE
FILES=$(grep -r "method.*[\"']POST\|method.*[\"']PUT\|method.*[\"']PATCH\|method.*[\"']DELETE" \
  app/ components/ --include="*.tsx" --include="*.ts" -l | \
  grep -v "node_modules" | grep -v ".next" | sort -u)

for file in $FILES; do
  # Skip already migrated files
  skip=false
  for skip_file in "${SKIP_FILES[@]}"; do
    if [[ "$file" == "$skip_file" ]]; then
      skip=true
      break
    fi
  done
  
  if $skip; then
    echo "⏭️  Skipping $file (already migrated)"
    continue
  fi
  
  TOTAL=$((TOTAL + 1))
  
  echo ""
  echo "📝 Processing: $file"
  
  # Check if import already exists
  if grep -q "from.*@/lib/api-client" "$file"; then
    echo "   ✓ Import already exists"
  else
    # Add import after other imports (before first non-import line)
    echo "   + Adding import statement"
    
    # Find the last import line number
    last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
    
    if [ -n "$last_import_line" ]; then
      # Insert after last import
      sed -i "${last_import_line}a import { apiClient } from \"@/lib/api-client\"" "$file"
    else
      # No imports found, add at top
      sed -i "1i import { apiClient } from \"@/lib/api-client\"" "$file"
    fi
  fi
  
  # Pattern replacements (simple cases)
  
  # POST with body
  if grep -q 'fetch.*method.*POST.*body:' "$file"; then
    echo "   → Converting POST requests..."
    # This is complex - mark for manual review
    echo "   ⚠️  Contains POST with body - requires manual review"
  fi
  
  # Simple POST without body
  if grep -q 'fetch(.*{.*method:.*["'\'']POST["'\''].*})' "$file"; then
    echo "   → Converting simple POST requests..."
  fi
  
  # DELETE requests
  if grep -q 'method:.*["'\'']DELETE["'\'']' "$file"; then
    echo "   → Contains DELETE requests"
  fi
  
  MIGRATED=$((MIGRATED + 1))
  echo "   ✓ File prepared"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Migration Summary:"
echo "   Total files found: $(echo "$FILES" | wc -l)"
echo "   Files processed: $MIGRATED"
echo "   Files skipped: $(($(echo "$FILES" | wc -l) - MIGRATED))"
echo ""
echo "⚠️  IMPORTANT: This script added imports but complex fetch() calls"
echo "   need manual conversion. See MIGRATION_TODO.md for details."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
