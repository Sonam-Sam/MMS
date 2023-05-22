const form = document.querySelector('form');
const dateInput = document.getElementById('choose_month');
const totalStudentInput = document.getElementById('total_student');
const stipendInput = document.getElementById('stipend');
const cutoffInput = document.getElementById('cutoff');

form.addEventListener('submit', (e) => {
  // Prevent form submission to allow client-side validation
  e.preventDefault();
  // Check if date is empty
  if (dateInput.value.trim() === '') {
    showError(dateInput, 'Date is required');
  } else {
    hideError(dateInput);
  }
  // Check if total student is empty and positive
  if (totalStudentInput.value.trim() === '') {
    showError(totalStudentInput, 'Total Student is required');
  } else if (totalStudentInput.value < 0) {
    showError(totalStudentInput, 'Total Student must be positive');
  } else if (totalStudentInput.value % 1 !== 0) {
    showError(totalStudentInput, 'Total Student must be a whole number');
  } else {
    hideError(totalStudentInput);
  }
  // Check if stipend per head is empty and positive
  if (stipendInput.value.trim() === '') {
    showError(stipendInput, 'Stipend per head is required');
  } else if (stipendInput.value < 0) {
    showError(stipendInput, 'Stipend per head must be positive');
  } else if (stipendInput.value % 1 !== 0) {
    showError(stipendInput, 'Stipend per head must be a whole number');
  } else {
    hideError(stipendInput);
  }
  // Check if cut off per head is empty and positive
  if (cutoffInput.value.trim() === '') {
    showError(cutoffInput, 'Cut off per head is required');
  } else if (cutoffInput.value < 0) {
    showError(cutoffInput, 'Cut off per head must be positive');
  } else if (cutoffInput.value % 1 !== 0) {
    showError(cutoffInput, 'Cut off per head must be a whole number');
  } else {
    hideError(cutoffInput);
  }
  // If all fields are valid, submit the form
  if (isValid()) {
    form.submit();
  }
});

// Function to show error message
function showError(input, message) {
  const formGroup = input.parentElement;
  const errorText = formGroup.querySelector('.invalid-feedback');
  formGroup.classList.add('has-error');
  errorText.innerText = message;
}

// Function to hide error message
function hideError(input) {
  const formGroup = input.parentElement;
  formGroup.classList.remove('has-error');
}

// Function to check if all fields are valid
function isValid() {
  return dateInput.value.trim() !== '' &&
    totalStudentInput.value.trim() !== '' &&
    totalStudentInput.value >= 0 &&
    totalStudentInput.value % 1 === 0 &&
    stipendInput.value.trim() !== '' &&
    stipendInput.value >= 0 &&
    stipendInput.value % 1 === 0 &&
    cutoffInput.value.trim() !== '' &&
    cutoffInput.value >= 0 &&
    cutoffInput.value % 1 === 0;
}

// Hide alert messages after 3 seconds
const messageBox = document.getElementById('message-box');

// If message box exists, hide it after 5 seconds
if (messageBox) {
  setTimeout(() => {
    messageBox.classList.add('d-none');
  }, 5000);
}
