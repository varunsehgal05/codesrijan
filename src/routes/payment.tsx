import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/payment")({
    component: PaymentPage,
});

function PaymentPage() {
    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
                  

            <main className="flex-grow max-w-[800px] mx-auto w-full px-margin-desktop py-16 flex flex-col gap-8">

        {/* Global Go Back Navigation */}
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>
    
                <header className="border-b-4 border-ink-black pb-6 mb-4">
                    <h1 className="font-headline-lg text-[48px] text-ink-black uppercase tracking-tight">Complete Registration</h1>
                    <p className="font-body-lg text-text-muted mt-2">Activate your team's participation in CodeSrijan '24.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <section className="bg-surface neo-border p-6 neo-shadow-lg flex flex-col h-full">
                        <h2 className="font-headline-md text-ink-black border-b-2 border-ink-black pb-2 mb-4 uppercase">Order Summary</h2>
                        <div className="flex flex-col gap-4 flex-grow">
                            <div className="flex justify-between font-body-md items-center">
                                <span className="text-ink-black">Base Registration Fee</span>
                                <span className="font-bold text-ink-black">₹ 1,500</span>
                            </div>
                            <div className="flex justify-between font-body-md items-center">
                                <span className="text-ink-black">Hardware Kit (Opt-in)</span>
                                <span className="font-bold text-ink-black">₹ 500</span>
                            </div>
                            <div className="flex justify-between font-body-md items-center text-electric-blue border-t-2 border-dashed border-ink-black pt-4 mt-auto">
                                <span className="font-bold uppercase">Total Due</span>
                                <span className="font-headline-md font-black">₹ 2,000</span>
                            </div>
                        </div>
                        <div className="bg-ink-black text-white p-4 neo-border mt-6">
                            <p className="font-label-caps text-xs">Team ID: <span className="text-electric-blue">#CS_9942</span></p>
                            <p className="font-label-caps text-xs">Squad Name: Syntax Error</p>
                        </div>
                    </section>

                    {/* Payment Details */}
                    <section className="flex flex-col gap-6">
                        <div className="bg-electric-blue text-white neo-border p-6 neo-shadow hover:-translate-y-1 transition-transform relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-[40px]">account_balance_wallet</span>
                            </div>
                            <h3 className="font-headline-md uppercase mb-1">Pay via UPI</h3>
                            <p className="font-body-sm text-primary-fixed-dim border-b border-primary-fixed-dim pb-4 mb-4">Fastest & zero fees.</p>
                            <div className="bg-white p-2 neo-border w-24 h-24 flex items-center justify-center mb-4">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="UPI QR Mock" className="w-full h-full" />
                            </div>
                            <p className="font-label-caps text-xs">Scan using any UPI App</p>
                        </div>

                        <div className="bg-surface neo-border p-6 neo-shadow hover:-translate-y-1 transition-transform relative cursor-pointer group">
                            <div className="absolute top-4 right-4 text-ink-black">
                                <span className="material-symbols-outlined text-[32px] group-hover:animate-pulse">credit_card</span>
                            </div>
                            <h3 className="font-headline-md uppercase text-ink-black mb-1">Cards / Netbanking</h3>
                            <p className="font-body-sm text-text-muted">Debit, Credit, Wallets</p>
                            <button onClick={() => alert("Redirecting to Secure Payment Gateway...")} className="mt-4 w-full bg-ink-black text-white font-button-text py-2 neo-border hover:bg-surface-variant hover:text-ink-black transition-colors">
                                Proceed to Gateway
                            </button>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="w-full py-8 text-center border-t-2 border-ink-black bg-surface mt-auto">
                <p className="font-label-caps text-text-muted">Secure Encrypted Checkout</p>
            </footer>
        </div>
    );
}
