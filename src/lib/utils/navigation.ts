/**
 * Centralized navigation logic for student records.
 * Returns a direct form section URL if the staff is assigned to only one section,
 * otherwise returns the standard student summary dashboard URL.
 */
export function getStudentNavigationUrl(
  studentId: string,
  eventId: string,
  currentUserId: string,
  formConfig: any,
  isAdmin: boolean,
  isReferredView: boolean = false,
  forceSummaryView: boolean = false,
  isPoc: boolean = false
): string {
  const root = isPoc ? "poc" : "staff";
  const baseUrl = `/${root}/workspace/${eventId}/student/${studentId}`;

  // Always go to summary if explicitly forced or in specialized clinical views (Referred/Observation)
  if (forceSummaryView || isReferredView) return baseUrl;

  const eventHeadId = formConfig?.eventHeadId;
  const isEventHead = !!currentUserId && eventHeadId === currentUserId;

  const assignments = formConfig?.sectionAssignments || {};
  const userAssignedSectionIds = Object.keys(assignments).filter(sectionId => {
    const list = assignments[sectionId] || [];
    return Array.isArray(list) && !!currentUserId && list.includes(currentUserId);
  });

  // Admins always go to summary. 
  // Others (including Event Head) go to summary UNLESS they have exactly one section assignment.
  if (isAdmin || userAssignedSectionIds.length !== 1) return baseUrl;

  // POC always go to summary
  if (isPoc) return baseUrl;

  // If assigned to EXACTLY one section, go directly to that section's form
  return `${baseUrl}/${userAssignedSectionIds[0]}`;
}
