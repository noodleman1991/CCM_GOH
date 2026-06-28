export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6">
            <div className="w-full max-w-sm sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
