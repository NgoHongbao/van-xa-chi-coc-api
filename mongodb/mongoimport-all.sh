#!/usr/bin/env bash
set -euo pipefail

MONGO_URI="${MONGODB_URI:-}"
MONGO_DB="${MONGODB_DB:-guild_manager}"

if [[ -z "$MONGO_URI" ]]; then
  echo "Thiếu MONGODB_URI." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMPORT_DIR="$SCRIPT_DIR/import"

import_collection() {
  local collection="$1"
  local file="$2"
  echo "Import $collection <- $file"
  mongoimport --uri "$MONGO_URI" --db "$MONGO_DB" --collection "$collection" --file "$IMPORT_DIR/$file" --jsonArray --drop
}

import_collection factions factions.json
import_collection roles roles.json
import_collection members members.json
import_collection legions legions.json
import_collection parties parties.json
import_collection globalNotes globalNotes.json

echo "Hoàn tất import MongoDB database '$MONGO_DB'."
