(function () {
  var form = document.getElementById('inquiry-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var scriptUrl = form.getAttribute('data-script-url');
    var submitBtn = document.getElementById('submit-btn');
    var errorEl = document.getElementById('form-error');
    var successEl = document.getElementById('form-success');

    errorEl.textContent = '';

    // Basic validation
    var name = form.querySelector('[name="name"]').value.trim();
    var email = form.querySelector('[name="email"]').value.trim();
    var pkg = form.querySelector('[name="package"]').value;
    var date = form.querySelector('[name="date"]').value;

    if (!name || !email || !pkg || !date) {
      errorEl.textContent = 'Please fill in all required fields.';
      return;
    }

    if (!scriptUrl) {
      // No script URL yet — just show success (dev/staging mode)
      form.hidden = true;
      successEl.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    var payload = new URLSearchParams({
      name: name,
      email: email,
      phone: form.querySelector('[name="phone"]').value.trim(),
      package: pkg,
      date: date,
      hours: form.querySelector('[name="hours"]').value,
      message: form.querySelector('[name="message"]').value.trim(),
      timestamp: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
    });

    fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: payload
    })
      .then(function () {
        form.hidden = true;
        successEl.hidden = false;
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Inquiry';
        errorEl.textContent = 'Something went wrong. Please try again or message us on Instagram.';
      });
  });
})();
