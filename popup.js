/**
 * Popup script for Arivu extension
 * Handles form validation and tab creation
 * @module popup
 */

document.addEventListener("DOMContentLoaded", () => {
  const filterForm = document.getElementById("filterForm");
  const subjectSelect = document.getElementById("subject");
  const gradeSelect = document.getElementById("grade");
  const durationSelect = document.getElementById("duration");
  const keywordsInput = document.getElementById("keywords");

  if (!filterForm) {
    console.error("Filter form not found");
    return;
  }

  /**
   * Validate form inputs
   * @returns {Object} Validation result with isValid flag and error message
   */
  function validateForm() {
    const keywords = keywordsInput.value.trim();

    // Keywords are optional, but if provided, should not be empty
    if (keywords && keywords.length < 2) {
      return {
        isValid: false,
        error: "Keywords must be at least 2 characters long",
      };
    }

    // Check for valid subject and grade
    if (!subjectSelect.value || !gradeSelect.value) {
      return {
        isValid: false,
        error: "Please select both subject and grade level",
      };
    }

    return { isValid: true };
  }

  /**
   * Show error message to user
   * @param {string} message - Error message to display
   */
  function showError(message) {
    // Remove existing error message
    const existingError = document.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    // Create error message element
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.setAttribute("role", "alert");
    errorDiv.setAttribute("aria-live", "polite");
    errorDiv.textContent = message;

    // Insert before form
    filterForm.parentNode.insertBefore(errorDiv, filterForm);

    // Focus on first invalid field
    if (keywordsInput.value.trim().length < 2 && keywordsInput.value.trim()) {
      keywordsInput.focus();
    } else {
      subjectSelect.focus();
    }

    // Remove error after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  function handleSubmit(e) {
    e.preventDefault();

    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      showError(validation.error);
      return;
    }

    // Get form values
    const subject = subjectSelect.value;
    const grade = gradeSelect.value;
    const duration = durationSelect.value;
    const keywords = keywordsInput.value.trim();

    // Build query parameters
    const queryParams = new URLSearchParams({
      subject,
      grade,
      duration,
      keywords,
    });

    // Open temp.html in a new tab
    try {
      chrome.tabs.create({
        url: chrome.runtime.getURL("temp.html?" + queryParams.toString()),
      });

      // Close popup after successful navigation (optional)
      // window.close();
    } catch (error) {
      console.error("Error opening tab:", error);
      showError("Failed to open video page. Please try again.");
    }
  }

  // Attach submit handler
  filterForm.addEventListener("submit", handleSubmit);

  // Clear error message when user starts typing/selecting
  [keywordsInput, subjectSelect, gradeSelect, durationSelect].forEach(
    (element) => {
      element.addEventListener("input", () => {
        const errorMessage = document.querySelector(".error-message");
        if (errorMessage) {
          errorMessage.remove();
        }
      });
    }
  );

  // Keyboard accessibility: Allow Enter key to submit
  filterForm.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "BUTTON") {
      // Let default behavior handle it (form submission)
      return;
    }
  });
});
