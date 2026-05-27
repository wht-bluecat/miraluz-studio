// ============================================================
// MIRALUZ STUDIO — Multi-Step Booking Wizard
// Step 1: Package + Duration → Step 2: Date + Time → Step 3: Contact → Payment
// ============================================================

(function () {
  var wizard = document.getElementById('booking-wizard');
  if (!wizard) return;

  var scriptUrl = wizard.getAttribute('data-script-url');
  var bookedSlots = [];

  // --- STATE ---
  var state = {
    package: '',
    hours: '',
    date: '',
    startTime: '',
    step: 1
  };

  // --- ELEMENTS ---
  var panels = wizard.querySelectorAll('.wizard-panel');
  var progressSteps = wizard.querySelectorAll('.wizard-step');

  // Step 1
  var packageCards = wizard.querySelectorAll('.package-card');
  var durationPills = wizard.querySelectorAll('.duration-pill');
  var next1 = document.getElementById('next-1');

  // Step 2
  var calendarEl = document.getElementById('calendar');
  var calendarMonthEl = document.getElementById('calendar-month');
  var calendarGridEl = document.getElementById('calendar-grid');
  var calendarPrev = document.getElementById('calendar-prev');
  var calendarNext = document.getElementById('calendar-next');
  var timePanel = document.getElementById('time-panel');
  var timeSlotsEl = document.getElementById('time-slots');
  var timePanelDate = document.getElementById('time-panel-date');
  var next2 = document.getElementById('next-2');
  var back2 = document.getElementById('back-2');

  // Step 3
  var form = document.getElementById('inquiry-form');
  var back3 = document.getElementById('back-3');

  // Sidebar elements
  var sidebarPkg = document.getElementById('sidebar-package');
  var sidebarDur = document.getElementById('sidebar-duration');
  var sidebarPkg2 = document.getElementById('sidebar-package-2');
  var sidebarDur2 = document.getElementById('sidebar-duration-2');
  var sidebarDatetime = document.getElementById('sidebar-datetime');

  // Calendar state
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
  var dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // =====================
  // STEP NAVIGATION
  // =====================

  function goToStep(n) {
    state.step = n;
    panels.forEach(function (p, i) {
      p.classList.toggle('active', i === n - 1);
    });
    progressSteps.forEach(function (s) {
      var sn = parseInt(s.getAttribute('data-step'));
      s.classList.toggle('active', sn === n);
      s.classList.toggle('completed', sn < n);
    });
    // Scroll to top of wizard
    wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (n === 2) {
      updateSidebar();
      renderCalendar();
    }
    if (n === 3) {
      updateSidebar();
      populateHiddenFields();
    }
  }

  function updateSidebar() {
    var pkgShort = state.package.split('—')[0].trim();
    if (sidebarPkg) sidebarPkg.textContent = pkgShort;
    if (sidebarDur) sidebarDur.textContent = state.hours + ' hours';
    if (sidebarPkg2) sidebarPkg2.textContent = pkgShort;
    if (sidebarDur2) sidebarDur2.textContent = state.hours + ' hours';
    if (sidebarDatetime && selectedDate && state.startTime) {
      var endTime = calcEndTime(state.startTime, state.hours);
      sidebarDatetime.textContent = formatDateFull(selectedDate) + ' at ' + state.startTime + ' — ' + endTime;
    }
  }

  function populateHiddenFields() {
    document.getElementById('package').value = state.package;
    document.getElementById('hours').value = state.hours;
    document.getElementById('date').value = state.date;
    document.getElementById('start-time').value = state.startTime;
  }

  // =====================
  // STEP 1: Package + Duration
  // =====================

  packageCards.forEach(function (card) {
    card.addEventListener('click', function () {
      packageCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      state.package = card.getAttribute('data-package');
      checkStep1();
    });
  });

  durationPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      durationPills.forEach(function (p) { p.classList.remove('selected'); });
      pill.classList.add('selected');
      state.hours = pill.getAttribute('data-hours');
      checkStep1();
    });
  });

  function checkStep1() {
    next1.disabled = !(state.package && state.hours);
  }

  next1.addEventListener('click', function () {
    if (state.package && state.hours) goToStep(2);
  });

  // =====================
  // STEP 2: Calendar + Time Slots
  // =====================

  function renderCalendar() {
    calendarMonthEl.textContent = monthNames[viewMonth] + ' ' + viewYear;

    var firstDay = new Date(viewYear, viewMonth, 1).getDay();
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);
    minDate.setHours(0, 0, 0, 0);

    var html = '';
    for (var d = 0; d < 7; d++) {
      html += '<div class="cal-day-name">' + dayNames[d] + '</div>';
    }
    for (var e = 0; e < firstDay; e++) {
      html += '<div class="cal-day empty"></div>';
    }
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

    calendarGridEl.querySelectorAll('.cal-day:not(.disabled):not(.booked):not(.empty)').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = btn.getAttribute('data-date');
        selectedDate = new Date(d + 'T00:00:00');
        state.date = d;
        state.startTime = '';
        next2.disabled = true;
        renderCalendar();
        showTimeSlots();
      });
    });
  }

  function showTimeSlots() {
    if (!selectedDate) return;
    timePanel.hidden = false;

    var dateStr = formatDateISO(selectedDate);
    timePanelDate.textContent = dayNamesFull[selectedDate.getDay()] + ', ' +
      monthNames[selectedDate.getMonth()] + ' ' + selectedDate.getDate() + ', ' + selectedDate.getFullYear();

    var dayBookings = getBookedTimesForDate(dateStr);
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

    var times = [
      '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
      '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
    ];

    var dur = parseInt(state.hours) || 3;
    var html = '';

    times.forEach(function (t) {
      var hour = parseTimeToHour(t);
      // Check if entire block fits without overlapping booked hours
      var blocked = false;
      for (var h = hour; h < hour + dur; h++) {
        if (takenHours[h] || h >= 22) { // 22 = 10PM hard cutoff
          blocked = true;
          break;
        }
      }

      var endTime = calcEndTime(t, dur);
      var isSelected = state.startTime === t;

      if (blocked) {
        html += '<button type="button" class="time-slot booked" disabled>' + t + '</button>';
      } else {
        html += '<button type="button" class="time-slot' + (isSelected ? ' selected' : '') + '" data-time="' + t + '">' + t + '</button>';
      }
    });

    timeSlotsEl.innerHTML = html;

    timeSlotsEl.querySelectorAll('.time-slot:not(.booked)').forEach(function (btn) {
      btn.addEventListener('click', function () {
        timeSlotsEl.querySelectorAll('.time-slot').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        state.startTime = btn.getAttribute('data-time');
        next2.disabled = false;
        updateSidebar();
      });
    });
  }

  calendarPrev.addEventListener('click', function () {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });

  calendarNext.addEventListener('click', function () {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  next2.addEventListener('click', function () {
    if (state.date && state.startTime) goToStep(3);
  });

  back2.addEventListener('click', function () { goToStep(1); });

  // =====================
  // STEP 3: Contact Form → Payment
  // =====================

  back3.addEventListener('click', function () { goToStep(2); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var submitBtn = document.getElementById('submit-btn');
    var errorEl = document.getElementById('form-error');
    errorEl.textContent = '';

    var name = form.querySelector('[name="name"]').value.trim();
    var email = form.querySelector('[name="email"]').value.trim();

    if (!name || !email) {
      errorEl.textContent = 'Please fill in your name and email.';
      return;
    }

    var endTime = calcEndTime(state.startTime, state.hours);
    var timeSlot = state.startTime + ' — ' + endTime;

    if (!scriptUrl) {
      redirectToPayment({
        bookingId: 'DEMO-' + Date.now().toString(36).toUpperCase(),
        name: name,
        email: email,
        package: state.package,
        date: state.date,
        timeSlot: timeSlot,
        hours: state.hours
      });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    var payload = new URLSearchParams({
      name: name,
      email: email,
      phone: form.querySelector('[name="phone"]').value.trim(),
      package: state.package,
      date: state.date,
      startTime: state.startTime,
      hours: state.hours,
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
        redirectToPayment({
          bookingId: 'ML-' + Date.now().toString(36).toUpperCase(),
          name: name,
          email: email,
          package: state.package,
          date: state.date,
          timeSlot: timeSlot,
          hours: state.hours
        });
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Continue to Payment';
        errorEl.textContent = 'Something went wrong. Please try again or message us on Instagram.';
      });
  });

  function redirectToPayment(data) {
    var params = new URLSearchParams(data);
    window.location.href = 'payment.html?' + params.toString();
  }

  // =====================
  // AVAILABILITY
  // =====================

  function loadAvailability() {
    if (!scriptUrl) { renderCalendar(); return; }
    fetch(scriptUrl + '?action=availability')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        bookedSlots = data.bookedSlots || [];
      })
      .catch(function () {})
      .finally(function () {
        // Calendar will render when step 2 is shown
      });
  }

  loadAvailability();

  // =====================
  // HELPERS
  // =====================

  function formatDateISO(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function formatDateFull(d) {
    return dayNamesFull[d.getDay()] + ', ' + monthNames[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

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

  function isDateFullyBooked(dateStr) {
    var hoursBooked = 0;
    bookedSlots.forEach(function (slot) {
      var sd = normalizeDate(slot.date);
      if (sd === dateStr) hoursBooked += parseInt(slot.hours) || 3;
    });
    return hoursBooked >= 14;
  }

  function getBookedTimesForDate(dateStr) {
    var booked = [];
    bookedSlots.forEach(function (slot) {
      if (normalizeDate(slot.date) === dateStr) booked.push(slot);
    });
    return booked;
  }

  function normalizeDate(d) {
    if (d instanceof Date) return formatDateISO(d);
    if (typeof d === 'string' && d.includes('/')) {
      var parts = d.split('/');
      return parts[2] + '-' + parts[0].padStart(2, '0') + '-' + parts[1].padStart(2, '0');
    }
    return d;
  }

})();
