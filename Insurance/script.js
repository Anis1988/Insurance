document.addEventListener('DOMContentLoaded',function(){
  const y=document.getElementById('year');if(y) y.textContent=new Date().getFullYear();
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const tgt=document.querySelector(a.getAttribute('href'));
      if(tgt){e.preventDefault();tgt.scrollIntoView({behavior:'smooth'});}
    });
  });

  // Privacy modal behavior (open via any link with .footer-privacy)
  const privacyModal = document.getElementById('privacyModal');
  const footerLinks = document.querySelectorAll('.footer-privacy');
  if (footerLinks && footerLinks.length && privacyModal) {
    const closeBtns = privacyModal.querySelectorAll('[data-close]');
    const openModal = () => { privacyModal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
    const closeModal = () => { privacyModal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
    footerLinks.forEach(link => {
      link.addEventListener('click', e => { e.preventDefault(); openModal(); });
    });
    closeBtns.forEach(b => b.addEventListener('click', closeModal));
    privacyModal.addEventListener('click', e => { if (e.target === privacyModal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && privacyModal.getAttribute('aria-hidden') === 'false') closeModal(); });
  }

  // Initialize EmailJS (use same public key as WebTax_v1)
  try {
    if (typeof emailjs !== 'undefined') {
      emailjs.init('DVi_ewXBvYF486znT');
    }
  } catch (err) {
    console.warn('EmailJS init failed:', err && err.message ? err.message : err);
  }

  function getFieldLabel(element) {
    if (element.id) {
      const label = document.querySelector('label[for="' + element.id + '"]');
      if (label) return label.textContent.replace(/\*/g, '').trim();
    }
    const fallback = element.name || element.id || 'field';
    return fallback
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function collectFormFields(form) {
    const data = {};
    const summaryLines = [];
    const radioGroupsSeen = new Set();

    Array.from(form.elements).forEach((element) => {
      if (!element || !element.name || element.disabled) return;

      const type = (element.type || '').toLowerCase();
      if (['submit', 'button', 'reset', 'file'].includes(type)) return;

      if (type === 'radio') {
        if (radioGroupsSeen.has(element.name)) return;
        radioGroupsSeen.add(element.name);

        const selected = form.querySelector('input[type="radio"][name="' + element.name + '"]:checked');
        const value = selected ? String(selected.value).trim() : 'Not selected';
        data[element.name] = value;
        summaryLines.push(getFieldLabel(element) + ': ' + value);
        return;
      }

      if (type === 'checkbox') {
        const checkedValue = element.checked ? (element.value && element.value !== 'on' ? element.value : 'Yes') : 'No';
        data[element.name] = checkedValue;
        // Keep SMS opt-in out of regular field summary; add a short note at the end instead.
        if (element.name !== 'insSmsOptIn') {
          summaryLines.push(getFieldLabel(element) + ': ' + checkedValue);
        }
        return;
      }

      if (element.tagName === 'SELECT' && element.multiple) {
        const selectedValues = Array.from(element.selectedOptions).map((opt) => opt.value.trim()).filter(Boolean);
        const value = selectedValues.length ? selectedValues.join(', ') : 'Not selected';
        data[element.name] = value;
        summaryLines.push(getFieldLabel(element) + ': ' + value);
        return;
      }

      const value = String(element.value || '').trim();
      data[element.name] = value;
      summaryLines.push(getFieldLabel(element) + ': ' + (value || '(empty)'));
    });

    return { data, summaryLines };
  }

  // Handle simple insurance form submission
  const insuranceForm = document.getElementById('insuranceForm');
  if (insuranceForm) {
    insuranceForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const { data, summaryLines } = collectFormFields(insuranceForm);
      const email = String(data.insEmail || data.email || data.from_email || '').trim();
      const phone = String(data.insPhone || data.phone || '').trim();
      const details = String(data.insMessage || data.message || '').trim();
      const smsOptIn = String(data.insSmsOptIn || '').toLowerCase() === 'yes';
      const msgDiv = document.getElementById('insuranceFormMessage');
      const submitBtn = insuranceForm.querySelector('button[type="submit"]');

      if (!email || !details) {
        if (msgDiv) msgDiv.textContent = 'Please provide your email and a short description.';
        return;
      }

      // basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (msgDiv) msgDiv.textContent = 'Please enter a valid email address.';
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';

      const consentNote = smsOptIn ? '(small note: user checked the sms consent box.)' : '';
      const fieldSummary = consentNote
        ? summaryLines.join('\n') + '\n\n' + consentNote
        : summaryLines.join('\n');

      const { insSmsOptIn, ...dataWithoutSmsOptIn } = data;

      const templateParams = {
        from_name: 'Issad Risk Solutions (Website)',
        from_email: email,
        reply_to: email,
        phone: phone,
        message: fieldSummary,
        sms_opt_in: smsOptIn ? 'Yes' : 'No',
        sms_disclaimer: consentNote || 'No SMS opt-in',
        to_email: 'aissad@farmersagent.com',
        details: details,
        field_summary: fieldSummary,
        submitted_at: new Date().toLocaleString(),
        ...dataWithoutSmsOptIn
      };

      // Use the same service/template IDs used in WebTax_v1
      emailjs.send('service_vak5n9d', 'template_k5uiwck', templateParams)
        .then(function(response) {
          if (msgDiv) {
            msgDiv.classList.remove('error');
            msgDiv.classList.add('success');
            msgDiv.innerHTML = '<span class="check-icon" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
              '<path d="M20 6L9 17l-5-5" fill="none"></path>' +
              '</svg></span><span>Thanks — your request has been sent. We will contact you soon.</span>';
          }
          insuranceForm.reset();

          // auto-dismiss success after 6s
          setTimeout(() => {
            if (msgDiv) {
              msgDiv.classList.remove('success');
              msgDiv.textContent = '';
            }
          }, 6000);
        }, function(error) {
          console.error('EmailJS send failed:', error);
          if (msgDiv) {
            msgDiv.classList.remove('success');
            msgDiv.classList.add('error');
            msgDiv.textContent = 'Sorry, something went wrong. Please try again later or email us directly.';
          }
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        });
    });
  }
});
