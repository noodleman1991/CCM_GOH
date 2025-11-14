import Link from "next/link";

export default function Custom404() {
    return (
        <div className="relative z-20 min-h-[80vh] flex items-center justify-center text-center">
            <div className="relative px-8 md:px-0 py-[4rem] sm:py-[5rem] md:py-[6.25rem] mx-auto sm:max-w-[37.5rem] md:max-w-[40.625rem] lg:max-w-[53.125rem] xl:max-w-[70rem] space-y-12">

                {/* English */}
                <div>
                    <h2 className="font-bold text-[5vw] sm:text-[1.75rem] md:text-[2rem] lg:text-[3rem] xl:text-[4rem] leading-[1.2]">
                        Hmm, we couldn’t find that page.
                    </h2>
                    <p className="mt-7 text-lg text-muted-foreground">
                        Maybe check the URL, or{" "}
                        <Link href="/" className="underline hover:text-foreground">
                            go back home
                        </Link>.
                    </p>
                </div>

                {/* Spanish */}
                <div>
                    <h2 className="font-bold text-[5vw] sm:text-[1.75rem] md:text-[2rem] lg:text-[3rem] xl:text-[4rem] leading-[1.2]">
                        Hmm, no pudimos encontrar esa página.
                    </h2>
                    <p className="mt-7 text-lg text-muted-foreground">
                        Tal vez revisa la URL o{" "}
                        <Link href="/" className="underline hover:text-foreground">
                            vuelve al inicio
                        </Link>.
                    </p>
                </div>

                {/* French */}
                <div>
                    <h2 className="font-bold text-[5vw] sm:text-[1.75rem] md:text-[2rem] lg:text-[3rem] xl:text-[4rem] leading-[1.2]">
                        Hmm, nous n’avons pas trouvé cette page.
                    </h2>
                    <p className="mt-7 text-lg text-muted-foreground">
                        Vérifie peut-être l’adresse, ou{" "}
                        <Link href="/" className="underline hover:text-foreground">
                            retourne à l’accueil
                        </Link>.
                    </p>
                </div>

                {/* Arabic */}
                <div dir="rtl" className="text-center">
                    <h2 className="font-bold text-[5vw] sm:text-[1.75rem] md:text-[2rem] lg:text-[3rem] xl:text-[4rem] leading-[1.2]">
                        هممم، ما قدرنا نلاقي الصفحة المطلوبة.
                    </h2>
                    <p className="mt-7 text-lg text-muted-foreground">
                        يمكن تتأكد من الرابط، أو{" "}
                        <Link href="/" className="underline hover:text-foreground">
                            ترجع للصفحة الرئيسية
                        </Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
