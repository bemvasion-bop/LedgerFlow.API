-- ========================================
-- MIGRATION: Update Plan Features - FINAL CLEAN VERSION
-- Date: May 16, 2026
-- Purpose: 
--   1. Add HasRoleBasedWorkflows column (if not exists)
--   2. Enable receipt uploads for Starter plan
--   3. Configure role-based workflows correctly
--   4. Remove HasMultiLevelApprovals column (if exists)
-- 
-- This migration is IDEMPOTENT and SAFE TO RERUN
-- ========================================

USE SpendSyncDB;
GO

SET NOCOUNT ON;
GO

PRINT '';
PRINT '========================================';
PRINT 'Plan Features Migration - FINAL VERSION';
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';
GO

-- ========================================
-- Step 1: Add HasRoleBasedWorkflows column (if not exists)
-- ========================================
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Plans]') 
    AND name = 'HasRoleBasedWorkflows'
)
BEGIN
    PRINT 'Step 1: Adding HasRoleBasedWorkflows column...';
    
    ALTER TABLE [dbo].[Plans]
    ADD [HasRoleBasedWorkflows] BIT NOT NULL DEFAULT 0;
    
    PRINT '  ✓ HasRoleBasedWorkflows column added';
    PRINT '';
END
ELSE
BEGIN
    PRINT 'Step 1: HasRoleBasedWorkflows column already exists - skipping';
    PRINT '';
END
GO

-- ========================================
-- Step 2: Copy data from old column (ONLY if old column still exists)
-- ========================================
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Plans]') 
    AND name = 'HasMultiLevelApprovals'
)
BEGIN
    PRINT 'Step 2: Copying data from HasMultiLevelApprovals...';
    
    -- Use dynamic SQL to avoid "Invalid column name" error
    DECLARE @CopySql NVARCHAR(MAX) = N'
        UPDATE [dbo].[Plans]
        SET [HasRoleBasedWorkflows] = [HasMultiLevelApprovals];
    ';
    
    EXEC sp_executesql @CopySql;
    
    DECLARE @RowsAffected INT = @@ROWCOUNT;
    PRINT '  ✓ Data copied (' + CAST(@RowsAffected AS VARCHAR) + ' rows)';
    PRINT '';
END
ELSE
BEGIN
    PRINT 'Step 2: Old column does not exist - skipping data copy';
    PRINT '';
END
GO

-- ========================================
-- Step 3: Update Starter plan features
-- ========================================
PRINT 'Step 3: Configuring Starter plan features...';

UPDATE [dbo].[Plans]
SET 
    [CanUploadReceipt] = 1,              -- ✅ Receipt uploads enabled
    [HasDepartmentAnalytics] = 0,        -- ❌ No departments in Starter
    [HasRoleBasedWorkflows] = 0          -- ❌ Admin + Employee only (no Finance/Audit)
WHERE [Name] = 'Starter';

IF @@ROWCOUNT > 0
BEGIN
    PRINT '  ✓ Starter plan configured:';
    PRINT '    - Receipt uploads: ENABLED';
    PRINT '    - Department analytics: DISABLED';
    PRINT '    - Role-based workflows: DISABLED';
    PRINT '    - Roles: Admin + Employee only';
END
ELSE
    PRINT '  ⚠ Warning: Starter plan not found';
PRINT '';
GO

-- ========================================
-- Step 4: Update Business plan features
-- ========================================
PRINT 'Step 4: Configuring Business plan features...';

UPDATE [dbo].[Plans]
SET 
    [CanUploadReceipt] = 1,              -- ✅ Receipt uploads enabled
    [HasDepartmentAnalytics] = 1,        -- ✅ Departments enabled
    [HasRoleBasedWorkflows] = 1          -- ✅ Finance + Audit roles enabled
WHERE [Name] = 'Business';

IF @@ROWCOUNT > 0
BEGIN
    PRINT '  ✓ Business plan configured:';
    PRINT '    - Receipt uploads: ENABLED';
    PRINT '    - Department analytics: ENABLED';
    PRINT '    - Role-based workflows: ENABLED';
    PRINT '    - Roles: Admin + Employee + Finance + Audit';
END
ELSE
    PRINT '  ⚠ Warning: Business plan not found';
PRINT '';
GO

-- ========================================
-- Step 5: Remove old column (if exists)
-- ========================================
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Plans]') 
    AND name = 'HasMultiLevelApprovals'
)
BEGIN
    PRINT 'Step 5: Removing old HasMultiLevelApprovals column...';
    
    -- Drop default constraint first (if exists)
    DECLARE @ConstraintName NVARCHAR(256);
    DECLARE @DropConstraintSql NVARCHAR(MAX);

    SELECT @ConstraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c 
        ON dc.parent_column_id = c.column_id 
        AND dc.parent_object_id = c.object_id
    WHERE c.object_id = OBJECT_ID(N'[dbo].[Plans]')
        AND c.name = 'HasMultiLevelApprovals';

    IF @ConstraintName IS NOT NULL
    BEGIN
        SET @DropConstraintSql = N'ALTER TABLE [dbo].[Plans] DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
        EXEC sp_executesql @DropConstraintSql;
        PRINT '  ✓ Default constraint dropped: ' + @ConstraintName;
    END

    -- Drop the column
    ALTER TABLE [dbo].[Plans]
    DROP COLUMN [HasMultiLevelApprovals];
    
    PRINT '  ✓ HasMultiLevelApprovals column removed';
    PRINT '';
END
ELSE
BEGIN
    PRINT 'Step 5: Old column already removed - skipping';
    PRINT '';
END
GO

-- ========================================
-- Step 6: Verify migration success
-- ========================================
PRINT '========================================';
PRINT 'Verification Results:';
PRINT '========================================';
PRINT '';

-- Check column migration
DECLARE @HasOldColumn BIT = 0;
DECLARE @HasNewColumn BIT = 0;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Plans]') AND name = 'HasMultiLevelApprovals')
    SET @HasOldColumn = 1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Plans]') AND name = 'HasRoleBasedWorkflows')
    SET @HasNewColumn = 1;

IF @HasOldColumn = 0 AND @HasNewColumn = 1
BEGIN
    PRINT '✓ Column migration: SUCCESS';
    PRINT '  - HasMultiLevelApprovals: REMOVED';
    PRINT '  - HasRoleBasedWorkflows: ADDED';
    PRINT '';
END
ELSE IF @HasOldColumn = 1
BEGIN
    PRINT '⚠ WARNING: Old column still exists!';
    PRINT '  - HasMultiLevelApprovals: STILL PRESENT';
    PRINT '';
END
ELSE IF @HasNewColumn = 0
BEGIN
    PRINT '⚠ WARNING: New column not found!';
    PRINT '  - HasRoleBasedWorkflows: MISSING';
    PRINT '';
END

-- Display current plan configuration
PRINT 'Current Plan Configuration:';
PRINT '----------------------------';

SELECT 
    [Id],
    [Name],
    [CanUploadReceipt] AS [Receipt_Uploads],
    [HasDepartmentAnalytics] AS [Dept_Analytics],
    [HasRoleBasedWorkflows] AS [Role_Workflows],
    [HasAdvancedReports] AS [Adv_Reports],
    [HasAdvancedAnalytics] AS [Adv_Analytics],
    [MaxUsers],
    [MaxExpensesPerMonth] AS [Max_Expenses]
FROM [dbo].[Plans]
ORDER BY [Id];
GO

PRINT '';
PRINT '========================================';
PRINT 'Migration Completed Successfully!';
PRINT '========================================';
PRINT '';
PRINT '┌─────────────────────────────────────┐';
PRINT '│ STARTER PLAN                        │';
PRINT '├─────────────────────────────────────┤';
PRINT '│ ✅ Receipt uploads                  │';
PRINT '│ ✅ Expense tracking                 │';
PRINT '│ ✅ Basic dashboard                  │';
PRINT '│ ✅ PDF reports                      │';
PRINT '│ ✅ Audit logs                       │';
PRINT '│ ✅ Export to Excel                  │';
PRINT '│ ✅ Admin approvals                  │';
PRINT '│ ✅ Reimbursements                   │';
PRINT '│ ✅ 10 users max                     │';
PRINT '│ ✅ 100 expenses/month               │';
PRINT '│                                     │';
PRINT '│ ROLES:                              │';
PRINT '│   • Admin (approves & reimburses)   │';
PRINT '│   • Employee (submits expenses)     │';
PRINT '│                                     │';
PRINT '│ ❌ Finance role                     │';
PRINT '│ ❌ Audit role                       │';
PRINT '│ ❌ Departments                      │';
PRINT '│ ❌ Advanced analytics               │';
PRINT '└─────────────────────────────────────┘';
PRINT '';
PRINT '┌─────────────────────────────────────┐';
PRINT '│ BUSINESS PLAN                       │';
PRINT '├─────────────────────────────────────┤';
PRINT '│ ✅ Everything in Starter            │';
PRINT '│ ✅ Finance role                     │';
PRINT '│ ✅ Audit role                       │';
PRINT '│ ✅ Departments                      │';
PRINT '│ ✅ Role-based workflows             │';
PRINT '│ ✅ Advanced analytics               │';
PRINT '│ ✅ Advanced reports                 │';
PRINT '│ ✅ Priority support                 │';
PRINT '│ ✅ Unlimited users                  │';
PRINT '│ ✅ Unlimited expenses               │';
PRINT '│                                     │';
PRINT '│ ROLES:                              │';
PRINT '│   • Admin (approves expenses)       │';
PRINT '│   • Employee (submits expenses)     │';
PRINT '│   • Finance (processes reimburse)   │';
PRINT '│   • Audit (views logs & reports)    │';
PRINT '└─────────────────────────────────────┘';
PRINT '';
PRINT '========================================';
PRINT 'Script completed: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
GO

SET NOCOUNT OFF;
GO
