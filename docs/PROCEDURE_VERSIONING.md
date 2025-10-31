# Procedure Versioning Guide

This guide covers the complete procedure versioning system, including version history, diff comparison, and rollback capabilities.

## Overview

The procedure versioning system provides:
- **Immutable version history** for all published stored procedures
- **Side-by-side diff comparison** using Monaco Diff Editor
- **Rollback capabilities** to restore previous versions
- **Role-based permissions** for versioning operations
- **Activity auditing** for all versioning actions

## Version Creation

### Automatic Version Snapshots

Versions are created automatically when:
- A stored procedure is **published** (draft → published)
- The version contains the exact SQL text that was deployed
- Versions are numbered incrementally starting at 1 per procedure

### What Doesn't Create Versions

The following operations do **not** create versions:
- Saving drafts
- Unpublishing procedures
- Validation failures
- Rollback operations (creates new draft instead)

## Version History Interface

### Accessing Version History

1. Navigate to the SQL Editor
2. Select a stored procedure
3. Click the "Version History" button in the toolbar

### Version List Display

Each version item shows:
- `v{number} • {creator} • {date}` (e.g., "v3 • john.doe • 2025-10-31")
- The latest version is labeled as "Current"
- Versions are sorted by creation date (newest first)

## View Mode

### Single Version Preview

1. Open Version History dialog
2. Ensure "View" mode is selected (default)
3. Click on any version to preview its SQL content
4. The full SQL text is displayed with syntax highlighting

## Compare Mode

### Side-by-Side Diff

1. Open Version History dialog
2. Switch to "Compare" mode using the toggle
3. Select exactly two versions:
   - Click the first version (left panel)
   - Click the second version (right panel)
4. View the side-by-side diff with:
   - SQL syntax highlighting
   - Change indicators (added/removed/modified lines)
   - Toggle options for whitespace and word-wrap

### Diff Features

- **Monaco Diff Editor** with full SQL language support
- **Line-by-line comparison** with change highlighting
- **Navigation controls** to jump between changes
- **Toggle options** for whitespace visibility and word wrapping

## Rollback Operations

### Rollback Permissions

- **Authors**: Can rollback procedures they created
- **Owners**: Can rollback any procedure in the workspace
- **Members**: Can view history and diffs but cannot rollback

### Rollback Process

1. Open Version History dialog
2. Select the version to rollback to
3. Click "Rollback" button
4. Choose rollback option:
   - **"Rollback Only"**: Creates new draft from selected version
   - **"Rollback & Publish"**: Creates draft and immediately publishes

### Rollback Behavior

- Procedure status changes to **draft** (if previously published)
- `sqlDraft` field is replaced with selected version's SQL text
- **No new version** is created during rollback
- Activity entry is recorded for auditing
- Current version remains unchanged until new publish

### Rollback Confirmation

The confirmation dialog shows:
- Warning that rollback updates the Draft content
- Explanation that publish deploys to database
- Option to proceed with rollback only or rollback + publish

## API Endpoints

### List Versions
```http
GET /api/procedures/:procedureId/versions
```

Returns all published versions for a procedure, sorted by creation date.

### Get Specific Version
```http
GET /api/procedures/:procedureId/versions/:versionNumber
```

Returns a specific version with full SQL content and metadata.

### Rollback to Version
```http
POST /api/procedures/:procedureId/rollback
```

Rollbacks a procedure to a specific version number.

## Database Schema

### Procedure Versions Table

```sql
CREATE TABLE procedure_versions (
  id SERIAL PRIMARY KEY,
  procedureId INTEGER NOT NULL,
  workspaceId INTEGER NOT NULL,
  version INTEGER NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'published',
  name VARCHAR(255) NOT NULL,
  sqlText TEXT NOT NULL,
  createdBy INTEGER NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(procedureId, version)
);
```

### Constraints

- `version` is unique per procedure (incremental)
- Only `source="published"` versions are stored
- Foreign key relationships to procedures, workspaces, and users

## Activity Logging

All versioning operations create activity entries:

- **Version Created**: When a procedure is published
- **Procedure Rolled Back**: When rollback is performed
- Entries include user, timestamp, and relevant metadata

## Error Handling

### Common Error Scenarios

1. **Version Not Found**: Requested version number doesn't exist
2. **Permission Denied**: User lacks required role for operation
3. **Invalid Rollback**: Attempting to rollback to current version
4. **Procedure Not Found**: Target procedure doesn't exist

### Error Responses

```json
{
  "message": "Version 5 not found for procedure 123",
  "error": "Not Found",
  "statusCode": 404
}
```

## Best Practices

### Version Management

1. **Publish Meaningful Changes**: Only publish when ready to create a version
2. **Use Descriptive Names**: Procedure names should reflect their purpose
3. **Regular Review**: Use version history to track changes over time
4. **Test Before Publishing**: Use validation to catch errors before version creation

### Rollback Strategy

1. **Review Diff First**: Always compare versions before rollback
2. **Rollback Only**: Use "Rollback Only" to review changes before publishing
3. **Document Changes**: Use activity feed to track rollback reasons
4. **Team Communication**: Coordinate rollbacks with team members

### Security Considerations

1. **Role-Based Access**: Ensure proper role assignments
2. **Audit Trail**: Monitor activity feed for versioning operations
3. **Backup Strategy**: Version history serves as built-in backup
4. **Access Control**: Limit rollback permissions to trusted users

## Troubleshooting

### Common Issues

1. **Version History Not Showing**: Check if procedure has been published
2. **Rollback Disabled**: Verify user has Author/Owner role
3. **Diff Not Loading**: Ensure both versions are selected in Compare mode
4. **Permission Errors**: Check workspace membership and roles

### Debug Steps

1. Verify procedure exists and user has access
2. Check if procedure has published versions
3. Confirm user role and workspace membership
4. Review activity feed for operation history

## Performance Considerations

- **Version Storage**: Only published versions are stored (minimal overhead)
- **Diff Rendering**: Monaco Diff Editor handles large SQL files efficiently
- **Database Queries**: Indexed queries for fast version retrieval
- **Memory Usage**: Version history loads incrementally as needed

## Future Enhancements

Potential future features:
- **Branching**: Support for parallel development streams
- **Tagging**: Mark important versions with tags/labels
- **Export/Import**: Bulk version history management
- **Advanced Search**: Search within version SQL content
- **Merge Conflicts**: Handle concurrent editing scenarios