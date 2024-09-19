/**
 * Form validation with Just-validate.js
 */
const validate = new JustValidate(formEl, {
  errorFieldCssClass: ['is-invalid'],
});

const errorMessages = {
  first_name: 'First name is required',
  last_name: 'Last name is required',
  email: 'Email is required',
  phone_number: 'Valid US pgone number required',
  country: 'Country is required',
};

// Helper function to add validation fields, necessary for the feat of checkbox shipping address validation
function addValidationFields(fields) {
  fields.forEach(({ selector, rules, errorContainer }) => {
    validate.addField(selector, rules, { errorsContainer: errorContainer });
  });
}

// Default form validation rules;
const validationRules = [
  {
    selector: '#id_first_name',
    rules: [
      { rule: 'required', errorMessage: errorMessages.first_name },
      { rule: 'maxLength', value: 255 },
      {
        rule: 'customRegexp',
        value: /\b([A-ZÀ-ÿ][-,a-z. ']+[ ]*)+$/gi,
        errorMessage: 'Contains an invalid character',
      },
    ],
    errorContainer: '.invalid-fname',
  },
  {
    selector: '#id_last_name',
    rules: [
      { rule: 'required', errorMessage: errorMessages.last_name },
      { rule: 'maxLength', value: 255 },
      {
        rule: 'customRegexp',
        value: /\b([A-ZÀ-ÿ][-,a-z. ']+[ ]*)+$/gi,
        errorMessage: 'Contains an invalid character',
      },
    ],
    errorContainer: '.invalid-lname',
  },
  {
    selector: '#id_email',
    rules: [
      { rule: 'required', errorMessage: errorMessages.email },
      { rule: 'email', errorMessage: 'Email is invalid!' },
      { rule: 'maxLength', value: 255 },
    ],
    errorContainer: '.invalid-email',
  },
  {
    selector: '#id_phone_number',
    rules: [
      { rule: 'required', errorMessage: errorMessages.phone_number },
      {
        rule: 'customRegexp',
        value: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im,
        errorMessage: 'Invalid Number',
      },
      { rule: 'maxLength', value: 15 },
    ],
    errorContainer: '.invalid-ph',
  },
  {
    selector: '#id_shipping_address_line1',
    rules: [
      { rule: 'required', errorMessage: `Shipping address is required` },
      { rule: 'maxLength', value: 255 },
    ],
    errorContainer: '.invalid-shipping_address_line1',
  },
  {
    selector: '#id_shipping_address_line4',
    rules: [
      { rule: 'required', errorMessage: 'Shipping city is required' },
      { rule: 'maxLength', value: 255 },
    ],
    errorContainer: '.invalid-shipping_address_line4',
  },
  {
    selector: '#id_shipping_state',
    rules: [
      { rule: 'required', errorMessage: 'Shipping state/province is required' },
    ],
    errorContainer: '.invalid-shipping_state',
  },
  {
    selector: '#id_shipping_postcode',
    rules: [
      { rule: 'required', errorMessage: 'Shipping ZIP/Postcode is required' },
      { rule: 'maxLength', value: 64 },
    ],
    errorContainer: '.invalid-shipping_postcode',
  },
  {
    selector: '#id_shipping_country',
    rules: [{ rule: 'required', errorMessage: 'Shipping country is required' }],
    errorContainer: '.invalid-shipping_country',
  },
];

// Add validation fields to the form
addValidationFields(validationRules);

validate
  .onFail((fields) => {
    console.log('Field validation fail', fields);
  })
  .onSuccess((event) => {
    console.log('Field validation pass, submit card details', event);
    document.getElementById('payment_method').value = 'card_token';
    Spreedly.validate();
  });

/**
 * Card Validation with Spreedly iFrame
 */
const style =
  'color: #212529; font-size: 1rem; line-height: 1.5; font-weight: 400;width: calc(100% - 20px); height: calc(100% - 2px); position: absolute;padding: 0.13rem .75rem';

// Set placeholders and styles for iframe fields to make UI style
Spreedly.on('ready', function () {
  Spreedly.setFieldType('text');
  Spreedly.setPlaceholder('cvv', 'CVV');
  Spreedly.setPlaceholder('number', 'Card Number');
  Spreedly.setNumberFormat('prettyFormat');
  Spreedly.setStyle('cvv', style);
  Spreedly.setStyle('number', style);

  btnCC.removeAttribute('disabled');
});

// Handle form submit and tokenize the card
function submitPaymentForm() {
  // Reset form when submitting, only for demo page, can ignore
  cardErrBlock.innerHTML = '';

  const requiredFields = {
    first_name: firstName.value,
    last_name: lastName.value,
    month: expMonth.value,
    year: expYear.value,
  };

  Spreedly.tokenizeCreditCard(requiredFields);
}

// Handle tokenization errors from Spreedly to show to end user
Spreedly.on('errors', function (errors) {
  console.log('Card validation fail', errors);
  let errorHtml = errors
    .map((element) => {
      if (element['attribute'] === 'number') {
        numberParent.classList.add('is-invalid');
        numberParent.classList.remove('is-valid');
      } else {
        numberParent.classList.remove('is-invalid');
      }
      if (element['attribute'] === 'month') {
        expMonth.classList.add('is-invalid');
        document.querySelector('.is-invalid').focus();
      } else {
        expMonth.classList.remove('is-invalid');
      }
      if (element['attribute'] === 'year') {
        expYear.classList.add('is-invalid');
        document.querySelector('.is-invalid').focus();
      } else {
        expYear.classList.remove('is-invalid');
      }
      return `${element.message}<br/>`;
    })
    .join('');

  if (errorHtml) {
    cardErrBlock.innerHTML = `
        <div class="alert alert-danger">
          ${errorHtml}
        </div>
      `;
  }

  btnCC.removeAttribute('disabled');
});

Spreedly.on('fieldEvent', function (name, type, activeEl, inputProperties) {
  if (type === 'input') {
    const isValid =
      name === 'number'
        ? inputProperties['validNumber']
        : inputProperties['validCvv'];
    const element = name === 'number' ? 'number' : 'cvv';
    const parent = name === 'number' ? numberParent : cvvParent;

    if (isValid) {
      Spreedly.setStyle(element, 'background-color: #CDFFE6;');
      parent.classList.remove('is-invalid');
    } else {
      Spreedly.setStyle(element, 'background-color: transparent;');
      parent.classList.remove('is-invalid');
      cardErrBlock.innerHTML = '';
    }
  }
});

Spreedly.on('validation', function (inputProperties) {
  if (!inputProperties['validNumber']) {
    numberParent.classList.add('is-invalid');
    Spreedly.transferFocus('number');
    numberParent.classList.remove('is-valid');
    cardErrBlock.innerHTML = `
        <div class="alert alert-danger">
          Please enter a valid card number
        </div>
      `;
  } else if (!inputProperties['validCvv']) {
    cvvParent.classList.add('is-invalid');
    Spreedly.transferFocus('cvv');
    cvvParent.classList.remove('is-valid');
    cardErrBlock.innerHTML = `
        <div class="alert alert-danger">
          Please enter a valid CVV number
        </div>
      `;
  } else {
    submitPaymentForm();
  }
});

// Handle payment method (card token) after successfully created
Spreedly.on('paymentMethod', function (token, pmData) {
  document.getElementById('card_token').value = token;
  createOrder();
});

function updateBillingValidation() {
  const billingFields = [
    '#id_billing_first_name',
    '#id_billing_last_name',
    '#id_billing_address_line1',
    '#id_billing_address_line4',
    '#id_billing_state',
    '#id_billing_postcode',
    '#id_billing_country',
  ];

  if (sameAsShippingCheckBox.checked) {
    formBill.classList.add('d-none');
    billingFields.forEach((selector) => validate.removeField(selector));
  } else {
    formBill.classList.remove('d-none');
    const billingValidationRules = [
      {
        selector: '#id_billing_first_name',
        rules: [
          { rule: 'required', errorMessage: errorMessages.first_name },
          { rule: 'maxLength', value: 255 },
          {
            rule: 'customRegexp',
            value: /\b([A-ZÀ-ÿ][-,a-z. ']+[ ]*)+$/gi,
            errorMessage: 'Contains an invalid character',
          },
        ],
        errorContainer: '.invalid-billing-fname',
      },
      {
        selector: '#id_billing_last_name',
        rules: [
          { rule: 'required', errorMessage: errorMessages.last_name },
          { rule: 'maxLength', value: 255 },
          {
            rule: 'customRegexp',
            value: /\b([A-ZÀ-ÿ][-,a-z. ']+[ ]*)+$/gi,
            errorMessage: 'Contains an invalid character',
          },
        ],
        errorContainer: '.invalid-billing-lname',
      },
      {
        selector: '#id_billing_address_line1',
        rules: [
          { rule: 'required', errorMessage: 'Billing address is required' },
          { rule: 'maxLength', value: 255 },
        ],
        errorContainer: '.invalid-billing_address_line1',
      },
      {
        selector: '#id_billing_address_line4',
        rules: [
          { rule: 'required', errorMessage: 'Billing city is required' },
          { rule: 'maxLength', value: 255 },
        ],
        errorContainer: '.invalid-billing_address_line4',
      },
      {
        selector: '#id_billing_state',
        rules: [
          {
            rule: 'required',
            errorMessage: 'Billing state/province is required',
          },
        ],
        errorContainer: '.invalid-billing_state',
      },
      {
        selector: '#id_billing_postcode',
        rules: [
          {
            rule: 'required',
            errorMessage: 'Billing ZIP/Postcode is required',
          },
          { rule: 'maxLength', value: 64 },
        ],
        errorContainer: '.invalid-billing_postcode',
      },
      {
        selector: '#id_billing_country',
        rules: [
          { rule: 'required', errorMessage: 'Billing country is required' },
        ],
        errorContainer: '.invalid-billing_country',
      },
    ];

    addValidationFields(billingValidationRules);
  }
}

sameAsShippingCheckBox.addEventListener('change', updateBillingValidation);
