// ============================================================
// MIRALUZ STUDIO — Booking System
// Calendar picker, availability checking, payment redirect
// ============================================================

(function () {
  var form = document.getElementById('inquiry-form');
  if (!form) return;

  var scriptUrl = form.getAttribute('data-script-url');
  var bookedSlots = [];

  // ---- CALENDAR PICKER ----

  var calendarEl = document.getElementById('calendar');
  var calendarMonthEl = document.getElementById('calendar-month');
  var calendarGridEl = document.getElementById('calendar-grid');
  var calendarPrev = document.getElementById('calendar-prev');
  var calendarNext = document.getElementById('calendar-next');
  var dateInput = document.getElementById('date');
  var selectedDateDisplay = document.getElementById('selected-date-display');

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var viewMonth = today.getMonth();
  var viewYear = today.getFullYear();
  var selectedDate = null;

  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function renderCalendar() {
    calendarMonthEl.textContent = monthNames[viewMonth] + ' ' + viewYear;

    var firstDay = new Date(viewYear, viewMonth, 1).getDay();
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var minDate = new Date();
    minDate.setDate(minDate.getDate() + 2); // 48h advance booking
    minDate.setHours(0, 0, 0, 0);

    var html = '';
    // Day headers
    for (var d = 0; d < 7; d++) {
      html += '<div class="cal-day-name">' + dayNames[d] + '</div>';
    }
    // Empty cells before first day
    for (var e = 0; e < firstDay; e++) {
      html += '<div class="cal-day empty"></div>';
    }
    // Days
    for (var i = 1; i <= daysInMonth; i++) {
      var date = new Date(viewYear, viewMonth, i);
      var dateStr = formatDateISO(date);
      var isPast = date < minDate;
      var isFullyBooked = isDateFullyBooked(dateStr);
      var isSelected = selectedDate && dateStr === formatDateISO(selectedDate);
      var isToday = dateStr === formatDateISO(today);

      var cls = 'cal-day';
      if (isPast) cls += ' disabled';
      else if (isFullyBooked) cls += ' booked';
      if (isSelected) cls += ' selected';
      if (isToday) cls += ' today';

      var disabled = isPast || isFullyBooked;
      html += '<button type="button" class="' + cls + '" data-date="' + dateStr + '"' +
        (disabled ? ' disabled' : '') + '>' + i + '</button>';
    }

    calendarGridEl.innerHTML = html;

    // Bind click events
    calendarGridEl.querySelectorAll('.cal-day:not(.disabled):not(.booked):not(.empty)').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = btn.getAttribute('data-date');
        selectedDate = new Date(d + 'T00:00:00');
        dateInput.value = d;
        if (selectedDateDisplay) {
          selectedDateDisplay.textContent = formatDateDisplay(selectedDate);
        }
        renderCalendar();
        updateTimeSlots();
      });
    });
  }

  function formatDateISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function formatDateDisplay(d) {
    return monthNames[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function isDateFullyBooked(dateStr) {
    // A date is fully booked if all time slots 7AM-9PM are covered
    var hoursBooked = 0;
    bookedSlots.forEach(function (slot) {
      var slotDate = slot.date;
      // Normalize date format from sheet
      if (slotDate instanceof Date) {
        slotDate = formatDateISO(slotDate);
      } else if (typeof slotDate === 'string' && slotDate.includes('/')) {
        // MM/DD/YYYY format from sheets
        var parts = slotDate.split('/');
        slotDate = parts[2] + '-' + parts[0].padStart(2, '0') + '-' + parts[1].padStart(2, '0');
      }
      if (slotDate === dateStr) {
        hoursBooked += parseInt(slot.hours) || 3;
      }
    });
    return hoursBooked >= 14; // 7AM to 9PM = 14 hours max
  }

  function getBookedTimesForDate(dateStr) {
    var booked = [];
    bookedSlots.forEach(function (slot) {
      var slotDate = slot.date;
      if (slotDate instanceof Date) {
        slotDate = formatDateISO(slotDate);
      } else if (typeof slotDate === 'string' && slotDate.includes('/')) {
        var parts = slotDate.split('/');
        slotDate = parts[2] + '-' + parts[0].padStart(2, '0') + '-' + parts[1].padStart(2, '0');
      }
      if (slotDate === dateStr) {
        booked.push(slot);
      }
    });
    return booked;
  }

  // ---- TIME SLOT AVAILABILITY ----

  var startTimeSelect = document.getElementById('start-time');
  var hoursSelect = document.getElementById('hours');

  function updateTimeSlots() {
    if (!selectedDate || !startTimeSelect) return;

    var dateStr = formatDateISO(selectedDate);
    var dayBookings = getBookedTimesForDate(dateStr);

    // Parse booked ranges into hour arrays
    var takenHours = {};
    dayBookings.forEach(function (slot) {
      var startHour = parseTimeToHour(slot.timeSlot.split('—')[0].trim());
      var duration = parseInt(slot.hours) || 3;
      if (startHour !== null) {
        for (var h = startHour; h < startHour + duration; h++) {
          takenHours[h] = true;
        }
      }
    });

    // Enable/disable time options
    var options = startTimeSelect.querySelectorAll('option');
    options.forEach(function (opt) {
      if (!opt.value) return; // skip placeholder
      var hour = parseTimeToHour(opt.value);
      if (hour !== null && takenHours[hour]) {
        opt.disabled = true;
        opt.textContent = opt.value + ' (booked)';
      } else {
        opt.disabled = false;
        opt.textContent = opt.value;
      }
    });
  }

  function parseTimeToHour(timeStr) {
    if (!timeStr) return null;
    var match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    var h = parseInt(match[1], 10);
    var period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h;
  }

  // Calendar nav
  if (calendarPrev) {
    calendarPrev.addEventListener('click', function () {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      renderCalendar();
    });
  }
  if (calendarNext) {
    calendarNext.addEventListener('click', function () {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      renderCalendar();
    });
  }

  // ---- FETCH AVAILABILITY ----

  function loadAvailability() {
    if (!scriptUrl) {
      renderCalendar();
      return;
    }
    fetch(scriptUrl + '?action=availability')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        bookedSlots = data.bookedSlots || [];
        renderCalendar();
      })
      .catch(function () {
        // Fail silently, just show calendar without availability data
        renderCalendar();
      });
  }

  loadAvailability();

  // ---- TIME CALCULATION ----

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

  // ---- FORM SUBMISSION → PAYMENT PAGE ----

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var submitBtn = document.getElementById('submit-btn');
    var errorEl = document.getElementById('form-error');

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
      // No backend: go straight to payment page with params
      redirectToPayment({
        bookingId: 'DEMO-' + Date.now().toString(36).toUpperCase(),
        name: name,
        email: email,
        package: pkg,
        date: date,
        timeSlot: timeSlot,
        hours: hours
      });
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
        // Redirect to payment page
        redirectToPayment({
          bookingId: 'ML-' + Date.now().toString(36).toUpperCase(),
          name: name,
          email: email,
          package: pkg,
          date: date,
          timeSlot: timeSlot,
          hours: hours
        });
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Inquiry';
        errorEl.textContent = 'Something went wrong. Please try again or message us on Instagram.';
      });
  });

  function redirectToPayment(data) {
    var params = new URLSearchParams(data);
    window.location.href = 'payment.html?' + params.toString();
  }

})();
