export function PainSection() {
  return (
    <section id="pain" className="section-pad">
      <div className="container-site max-w-3xl">
        <h2 className="reveal whitespace-pre-line text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          הפרסום שלך עובד.
          {'\n'}
          מה שקורה אחרי הקליק שובר אותך.
        </h2>
        <div className="reveal mt-8 space-y-4 prose-site">
          <p>
            אתה משלם על כל ליד. עשרות שקלים, לפעמים יותר. הליד ממלא טופס, מחכה. אתה
            באמצע עבודה, באמצע פגישה, באמצע החיים. עד שהתפנית לענות, הוא כבר סגר עם
            מישהו שענה קודם.
          </p>
          <p>
            זה לא קורה כי אתה לא מקצועי. זה קורה כי אתה בן אדם אחד, והלידים מגיעים
            עשרים וארבע שעות ביממה.
          </p>
          <p>
            והחלק הכי כואב: אתה אפילו לא יודע כמה זה עולה לך. כי אף אחד לא סופר את
            הלידים שנעלמו.
          </p>
        </div>
        <p className="reveal mt-12 text-xl font-bold text-foreground sm:text-2xl">
          בוא נספור עכשיו.
          <span className="ms-2 inline-block text-cta" aria-hidden>
            ↓
          </span>
        </p>
      </div>
    </section>
  );
}
