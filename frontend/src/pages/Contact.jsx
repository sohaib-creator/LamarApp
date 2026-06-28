import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  function handle(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
    setForm({ name: '', email: '', phone: '', subject: '', message: '' })
  }

  return (
    <>
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero-content">
            <div className="about-hero-badge">تواصل معنا</div>
            <h1>نحن هنا <span>لخدمتك</span></h1>
            <p>تواصل معنا لأي استفسار أو طلب، فريقنا جاهز للرد عليك في أقرب وقت.</p>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>معلومات التواصل</h2>
              <p>لا تتردد في التواصل معنا عبر أي من الوسائل التالية:</p>
              <div className="contact-info-list">
                <div className="contact-info-item">
                  <span className="contact-info-icon">📍</span>
                  <div>
                    <h4>العنوان</h4>
                    <p>الرياض، حي النخيل، المملكة العربية السعودية</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-icon">📞</span>
                  <div>
                    <h4>الهاتف</h4>
                    <p>9200XXXXX</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-icon">✉️</span>
                  <div>
                    <h4>البريد الإلكتروني</h4>
                    <p>info@lamar-water.com</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-icon">🕐</span>
                  <div>
                    <h4>ساعات العمل</h4>
                    <p>السبت - الخميس: 8:00 صباحاً - 10:00 مساءً<br />الجمعة: 2:00 مساءً - 8:00 مساءً</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form">
              {sent ? (
                <div className="contact-success">
                  <div className="contact-success-icon">✓</div>
                  <h3>تم إرسال الرسالة!</h3>
                  <p>شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.</p>
                  <button className="btn btn-primary" onClick={() => setSent(false)}>إرسال رسالة أخرى</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h2>أرسل لنا رسالة</h2>
                  <div className="form-row">
                    <input name="name" value={form.name} onChange={handle} placeholder="الاسم الكامل" required />
                    <input name="email" type="email" value={form.email} onChange={handle} placeholder="البريد الإلكتروني" required />
                  </div>
                  <div className="form-row">
                    <input name="phone" value={form.phone} onChange={handle} placeholder="رقم الجوال" />
                    <input name="subject" value={form.subject} onChange={handle} placeholder="الموضوع" required />
                  </div>
                  <textarea name="message" value={form.message} onChange={handle} placeholder="رسالتك..." rows="5" required></textarea>
                  <button type="submit" className="btn btn-primary btn-block btn-lg">إرسال الرسالة</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
