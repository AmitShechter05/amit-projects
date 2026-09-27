import Hero from '@/components/Hero';
import Bestsellers from '@/components/home/Bestsellers';
import Worn from '@/components/home/Worn';
import Scale from '@/components/home/Scale';
import Categories from '@/components/home/Categories';
import Process from '@/components/home/Process';
import Assurance from '@/components/home/Assurance';
import Closing from '@/components/home/Closing';
import Interlude from '@/components/home/Interlude';
import { INTERLUDES } from '@/lib/interludes';

/**
 * צילום בין הנושאים. הסדר והבחירה ב-lib/interludes.ts.
 * אחרי ההירו אין רצועה - צילום על צילום.
 * בטלפון נשארות שלוש מהשש: שש רצועות של ~300px היו 2,000 מתוך 9,700
 * פיקסל של העמוד. עמית (27.9.2026): "4, תסדר הכל"
 */
const [j2, j3, j4, j5, j6, j7] = INTERLUDES;

export default function HomePage() {
  return (
    <>
      <Hero />
      <Bestsellers />
      <Interlude shot={j2} />
      <Worn />
      <Interlude shot={j3} className="hidden md:block" />
      <Scale />
      <Interlude shot={j4} />
      <Categories />
      <Interlude shot={j5} className="hidden md:block" />
      <Process />
      <Interlude shot={j6} />
      <Assurance />
      <Interlude shot={j7} className="hidden md:block" />
      <Closing />
    </>
  );
}
