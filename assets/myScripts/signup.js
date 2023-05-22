// Function to validate the form
function validateForm() {
    // Get form inputs
    var name = document.getElementById("name");
    var email = document.getElementById("email");
    var role = document.getElementById("role");
    var gender = document.getElementById("gender");
    var contact = document.getElementById("contact");
    var password = document.getElementById("password");
 
    // Reset error messages and field colors
    var errorMessages = document.getElementsByClassName("error-message");
    for (var i = 0; i < errorMessages.length; i++) {
      errorMessages[i].textContent = "";
    }
    name.style.borderColor = "";
    email.style.borderColor = "";
    role.style.borderColor = "";
    gender.style.borderColor = "";
    contact.style.borderColor = "";
    password.style.borderColor = "";
 
    // Check if required fields are empty
    var isValid = true;
    if (name.value === "") {
   name.style.borderColor = "red";
   document.getElementById("name-error").textContent = "Please enter your full name.";
   isValid = false;
 } else if (name.value.length < 2 || name.value.length > 40) {
   name.style.borderColor = "red";
   document.getElementById("name-error").textContent = "Name must be between 2 and 40 characters.";
   isValid = false;
 } else {
   // Validate name format using a regular expression
   var namePattern = /^[A-Za-z\s]+$/;
   if (!namePattern.test(name.value)) {
     name.style.borderColor = "red";
     document.getElementById("name-error").textContent = "Invalid name format. Please use only letters and spaces.";
     isValid = false;
   }
 }
 
 
    if (email.value === "") {
   email.style.borderColor = "red";
   document.getElementById("email-error").textContent = "Please enter your email address.";
   isValid = false;
 } else if (!email.value.endsWith(".gcit@rub.edu.bt")) {
   email.style.borderColor = "red";
   document.getElementById("email-error").textContent = "Invalid email address. Email must end with '.gcit@rub.edu.bt'.";
   isValid = false;
 }
 
 
 
 
    if (role.value === "") {
      role.style.borderColor = "red";
      document.getElementById("role-error").textContent = "Please select your role.";
      isValid = false;
    }
 
    if (gender.value === "") {
      gender.style.borderColor = "red";
      document.getElementById("gender-error").textContent = "Please select your gender.";
      isValid = false;
    }
 
    if (contact.value === "") {
   contact.style.borderColor = "red";
   document.getElementById("contact-error").textContent = "Please enter your contact number.";
   isValid = false;
 } else if (!/^(17|77)\d{6}$/.test(contact.value)) {
   contact.style.borderColor = "red";
   document.getElementById("contact-error").textContent = "Invalid contact number. It should start with 17 or 77 and be 8 digits long.";
   isValid = false;
 }
 
 
 if (password.value === "") {
 password.style.borderColor = "red";
 document.getElementById("password-error").textContent = "Please enter your password.";
 isValid = false;
 } else if (password.value.length < 8) {
 password.style.borderColor = "red";
 document.getElementById("password-error").textContent = "Password must be more than 8 characters.";
 isValid = false;
 } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password.value)) {
 password.style.borderColor = "red";
 document.getElementById("password-error").textContent = "Password must contain at least one special character.";
 isValid = false;
 } else if (!/[A-Z]/.test(password.value)) {
 password.style.borderColor = "red";
 document.getElementById("password-error").textContent = "Password must contain at least one uppercase letter.";
 isValid = false;
 }
 
 
    // Validate email format using a regular expression
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.value !== "" && !emailPattern.test(email.value)) {
      email.style.borderColor = "red";
      document.getElementById("email-error").textContent = "Please enter a valid email address.";
      isValid = false;
    }
 
    // Validate contact number format using a regular expression
    var contactPattern = /^\+?\d{1,4}-?\d{5,}$/;
    if (contact.value !== "" && !contactPattern.test(contact.value)) {
      contact.style.borderColor = "red";
      document.getElementById("contact-error").textContent = "Please enter a valid contact number.";
      isValid = false;
    }
 
    // Additional validation logic can be added here based on your requirements
 
    // If any validation fails, prevent form submission
    if (!isValid) {
      return false;
    }
}
    