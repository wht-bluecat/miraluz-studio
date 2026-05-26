(function () {
  var form = document.getElementById('inquiry-form');
  if (!form) return;

  function calcEndTime(startTime, hours) {
    var match = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return '';
    var h = parseInt(match[1], 10);
    var m = match[2];
    var period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    h += parseInt(hours, 10);
    var endPeriod = h >= 12 && h < 24 ? 'PM' : 'AM';
    if (h >= 24) { h -= 24; endPeriod = 'AM'; }
    var endH = h % 12 || 12;
    return endH + ':' + m + ' ' + endPeriod;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var scriptUrl = form.getAttribute('data-script-url');
    var submitBtn = document.getElementById('submit-btn');
    var errorEl = document.getElementById('form-error');
    var successEl = document.getElementById('form-success');

    errorEl.textContent = '';

    var name = form.querySelector('[name="name"]').value.trim();
    var email = form.querySelector('[name="email"]').value.trim();
    var pkg = form.querySelector('[name="package"]').value;
    var date = form.querySelector('[name="date"]').value;
    var startTime = form.querySelector('[name="start-time"]').value;
    var hours = form.querySelector('[name="hours"]').value;

    if (!name || !email || !pkg || !date || !startTime) {
      errorEl.textContent = 'Please fill in all required fields.';
      return;
    }

    var endTime = calcEndTime(startTime, hours);
    var timeSlot = startTime + ' — ' + endTime;

    if (!scriptUrl) {
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
      startTime: startTime,
      hours: hours,
      timeSlot: timeSlot,
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
