import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/otp")({
    component: OTPVerification,
});

function OTPVerification() {
    return (
        <div className="min-h-screen bg-surface-container-lowest bg-pattern flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-pure-white brutal-border brutal-shadow-lg flex flex-col pt-8">
                {/* Header Ribbon */}
                <div className="bg-electric-blue text-pure-white p-4 brutal-border-b flex justify-between items-center -mt-8 mb-6 border-b-2 border-stark-black">
                    <h1 className="font-headline-md italic uppercase tracking-tighter">Identity Config</h1>
                    <span className="material-symbols-outlined sync-pulse">fingerprint</span>
                </div>

                <div className="px-8 pb-8 flex flex-col items-center">
                    <h2 className="font-display-lg text-headline-md leading-none text-stark-black text-center uppercase mb-2">
                        VERIFY ACCESS
                    </h2>
                    <p className="font-body-md text-on-surface-variant text-center mb-8">
                        Enter the 6-digit tactical code sent to your comms channel.
                    </p>

                    {/* Brutalist OTP Inputs */}
                    <div className="flex gap-2 justify-between w-full mb-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <input
                                key={i}
                                type="text"
                                maxLength={1}
                                className="w-12 h-14 bg-surface text-center font-display-lg text-2xl text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue focus:border-electric-blue transition-transform focus:-translate-y-1"
                                placeholder="0"
                            />
                        ))}
                    </div>

                    <button className="w-full bg-stark-black hover:bg-electric-blue text-pure-white py-4 font-label-caps text-lg brutal-border brutal-shadow transition-all duration-200">
                        AUTHORIZE OVERRIDE
                    </button>

                    <div className="mt-6 text-center">
                        <p className="font-code-snippet text-xs text-on-surface-variant mb-2">Code expires in <span className="text-destructive font-bold">04:59</span></p>
                        <Link to="/" className="font-label-bold text-electric-blue hover:underline underline-offset-4 uppercase text-sm">
                            Re-transmit Code
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
