const purchaseForm = document.getElementById('purchase-form');

// Get input fields
const purchaseDate = document.getElementById('purchase-date');
const cashMemo = document.getElementById('cash-memo');
const vendor = document.getElementById('vendor');
const item = document.getElementById('item');
const quantity = document.getElementById('quantity');
const unit = document.getElementById('unit');
const rate = document.getElementById('rate');
const journalNumber = document.getElementById('journal-number');

// Add event listener to form to validate inputs
purchaseForm.addEventListener('submit', function(event) {
  let isError = false;

  // Validate purchase date
  if (purchaseDate.value === '') {
    isError = true;
    purchaseDate.nextElementSibling.style.display = 'block';
    purchaseDate.style.borderColor = 'red';
  } else {
    purchaseDate.nextElementSibling.style.display = 'none';
    purchaseDate.style.borderColor = '#ced4da';
  }

  // Validate cash memo
  if (cashMemo.value === '' || !/^\d+(\.\d+)?$/.test(cashMemo.value)) {
    isError = true;
    cashMemo.nextElementSibling.innerHTML = 'Quantity must be a positive integer number.';
    cashMemo.nextElementSibling.style.display = 'block';
    cashMemo.style.borderColor = 'red';
  } else {
    cashMemo.nextElementSibling.style.display = 'none';
    cashMemo.style.borderColor = '#ced4da';
  }

  // Validate vendor
  if (vendor.value === '') {
    isError = true;
    vendor.nextElementSibling.style.display = 'block';
    vendor.style.borderColor = 'red';
  } else {
    vendor.nextElementSibling.style.display = 'none';
    vendor.style.borderColor = '#ced4da';
  }

  // Validate item
  if (item.value === '') {
    isError = true;
    item.nextElementSibling.style.display = 'block';
    item.style.borderColor = 'red';
  } else {
    item.nextElementSibling.style.display = 'none';
    item.style.borderColor = '#ced4da';
  }

  // Validate quantity
  if (quantity.value === '' || !/^\d+(\.\d+)?$/.test(quantity.value)) {
    isError = true;
    quantity.nextElementSibling.innerHTML = 'Quantity must be a positive integer number.';
    quantity.nextElementSibling.style.display = 'block';
    quantity.style.borderColor = 'red';
  } else {
    quantity.nextElementSibling.style.display = 'none';
    quantity.style.borderColor = '#ced4da';
  }

  // Validate unit
  if (unit.value === '') {
    isError = true;
    unit.nextElementSibling.style.display = 'block';
    unit.style.borderColor = 'red';
  } else {
    unit.nextElementSibling.style.display = 'none';
    unit.style.borderColor = '#ced4da';
  }

  // Validate rate
  if (rate.value === '' || !/^\d+(\.\d+)?$/.test(rate.value)) {
    isError = true;
    rate.nextElementSibling.innerHTML = 'Rate must be a positive integer number.';
    rate.nextElementSibling.style.display = 'block';
    rate.style.borderColor = 'red';
  } else {
    rate.nextElementSibling.style.display = 'none';
    rate.style.borderColor = '#ced4da';
  }

  // Validate journal number
  if (journalNumber.value === '' || !/^\d+(\.\d+)?$/.test(journalNumber.value)) {
    isError = true;
    journalNumber.nextElementSibling.innerHTML = 'Journal number must be a positive integer number.';
    journalNumber.nextElementSibling.style.display = 'block';
    journalNumber.style.borderColor = 'red';
  } else {
    journalNumber.nextElementSibling.style.display = 'none';
    journalNumber.style.borderColor = '#ced4da';
  }

  // Prevent form submission if there is
  if (isError) {
    event.preventDefault();
  }
  });






$(document).ready(function() {
  $( "#datepicker" ).datepicker({
    changeMonth: true,
    changeYear: true,
    showButtonPanel: true,
    dateFormat: 'MM yy',
    onClose: function(dateText, inst) {
      $(this).datepicker('setDate', new Date(inst.selectedYear, inst.selectedMonth, 1));
    }
  });
});
