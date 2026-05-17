# Security Specification for FitPulse

## Data Invariants
1. A **User** profile must only be manageable by the owner.
2. A **Workout** must be associated with a valid `userId` (the owner) and can only be read/updated by that owner.
3. An **Exercise** must be linked to a `workoutId` and a `userId`. Exercises can only be accessed by the owner of the associated workout.

## The "Dirty Dozen" Payloads (Deny Cases)
1. **Identity Spoofing**: Attempt to create a workout for another user.
2. **Resource Poisoning**: Create a workout with a 1MB string title.
3. **Orphaned Record**: Create an exercise for a non-existent workout.
4. **Foreign Update**: User A attempts to edit User B's workout.
5. **Shadow Field**: Add `isAdmin: true` to a user profile update.
6. **Timeline Tampering**: Set `createdAt` to a future date manually.
7. **Bulk Scraping**: Attempting to list all workouts without a userId filter.
8. **Invalid Set Type**: Submitting sets as a string instead of an array of objects.
9. **Negative Stats**: Set duration to -10 minutes.
10. **Immutable Violation**: Change the `userId` of an existing workout.
11. **Malicious ID**: Use a script-injection string as a document ID.
12. **Unauthorized Deletion**: User B tries to delete User A's profile.

## Red Team Pass/Fail Criteria
- Any write without `request.auth` must fail.
- Any update to `ownerId`/`userId` must fail.
- `list` operations must be restricted by `resource.data.userId == request.auth.uid`.
- All string inputs must have `.size()` checks.
