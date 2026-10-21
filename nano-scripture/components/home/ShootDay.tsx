import HeroVideo from '@/components/HeroVideo';

/**
 * סרטון יום הצילום, שישב בראש הדף מ-4.10 עד 21.10.2026. מאז ההירו הוא
 * תמונה עם זום לשבב (components/Hero.tsx), והסרטון עבר לכאן - מתחת
 * לפולד, ולכן הוא כבר אינו מאט את הטעינה הראשונה.
 */
export default function ShootDay() {
  return (
    <section className="py-16 md:py-24">
      <div className="shell">
        <h2 className="display t-2 text-center">ככה זה נראה עליהם</h2>
        <p className="lede mx-auto mt-3 max-w-[36rem] text-center">
          מגן דוד, צמיד קלוע, שרשרת אינסוף וצמיד אינסוף. בכל אחד מהם השבב הכחול, ועליו ברכה שלמה.
        </p>
        <div className="relative mx-auto mt-8 aspect-video w-full max-w-[1100px] overflow-hidden rounded-md">
          <HeroVideo
            className="absolute inset-0 h-full w-full object-cover"
            label="דוגמן ודוגמנית ביום צילום, עונדים שרשרת מגן דוד, צמיד קלוע, שרשרת אינסוף וצמיד אינסוף - כולם עם השבב הכחול"
          />
        </div>
      </div>
    </section>
  );
}
