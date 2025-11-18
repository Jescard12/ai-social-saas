"use client";

import firebaseApp, { auth, db, storage } from "../../firebase";


import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const sliderRef = useRef(null);

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black text-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-10 py-6 bg-transparent">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Buz<span className="text-indigo-500">AI</span>
        </h1>
        <nav className="hidden md:flex gap-8 text-gray-300 font-medium">
          <a href="#features" className="hover:text-indigo-400">Features</a>
          <a href="#how" className="hover:text-indigo-400">How it Works</a>
          <a href="#faq" className="hover:text-indigo-400">FAQ</a>
        </nav>
        <button
          onClick={() => router.push("/auth")}
          className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
        >
          Get Started
        </button>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center mt-20 px-6">
        <h2 className="text-5xl md:text-6xl font-extrabold max-w-3xl leading-tight">
          Build & Grow Your Business with Buz<span className="text-indigo-500">AI</span>
        </h2>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl">
          Your AI co-founder for strategy, content, and insights—24/7.
        </p>
        <div className="flex gap-4 mt-8">
          {/* Sign In button styled like previous Try Free */}
          <button
            onClick={() => router.push("/auth")}
            className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
          >
            Try Now For Free
          </button>
        </div>
      </section>

      {/* Features */}
<section id="features" className="mt-32 px-10">
  <h3 className="text-3xl font-bold text-center">
    Why Choose Buz<span className="text-indigo-500">AI</span>?
  </h3>
  <p className="text-gray-400 text-center mt-4 max-w-2xl mx-auto">
    Unlock the full potential of AI for your business. From strategy to content, BuzAI makes it fast, smart, and effective.
  </p>

  <div className="grid md:grid-cols-3 gap-10 mt-12">
    <div className="bg-gray-800/60 p-8 rounded-2xl shadow-lg hover:shadow-indigo-500/40 hover:scale-105 transition-transform duration-300 relative">
      <div className="text-indigo-500 text-4xl mb-4">📈</div>
      <h4 className="text-xl font-semibold">Business Strategy</h4>
      <p className="mt-4 text-gray-400">
        Generate <span className="text-indigo-400 font-medium">step-by-step business plans</span> tailored to your goals and market.
      </p>
      <span className="absolute top-4 right-4 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full shadow-md animate-pulse">
        Popular
      </span>
    </div>

    <div className="bg-gray-800/60 p-8 rounded-2xl shadow-lg hover:shadow-green-500/40 hover:scale-105 transition-transform duration-300 relative">
      <div className="text-green-400 text-4xl mb-4">📱</div>
      <h4 className="text-xl font-semibold">Social Media Posts</h4>
      <p className="mt-4 text-gray-400">
        Instantly create <span className="text-green-300 font-medium">high-converting posts</span> for Instagram, TikTok, LinkedIn, and more.
      </p>
      <span className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-md animate-pulse">
        New
      </span>
    </div>

    <div className="bg-gray-800/60 p-8 rounded-2xl shadow-lg hover:shadow-purple-500/40 hover:scale-105 transition-transform duration-300 relative">
      <div className="text-purple-400 text-4xl mb-4">💡</div>
      <h4 className="text-xl font-semibold">Smart Insights</h4>
      <p className="mt-4 text-gray-400">
        Get <span className="text-purple-300 font-medium">AI-powered analytics</span> and insights to grow faster and smarter.
      </p>
      <span className="absolute top-4 right-4 bg-purple-500 text-white text-xs px-2 py-1 rounded-full shadow-md animate-pulse">
        Hot
      </span>
    </div>
  </div>

  
</section>


      {/* How it Works */}
      <section id="how" className="mt-32 px-10 text-center">
        <h3 className="text-3xl font-bold">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-10 mt-12">
          <div className="p-6 bg-gray-800/60 rounded-xl">
            <span className="text-indigo-500 text-4xl font-extrabold">1</span>
            <h4 className="mt-4 text-xl font-semibold">Sign Up</h4>
            <p className="text-gray-400 mt-2">Create your account in less than 10 seconds.</p>
          </div>
          <div className="p-6 bg-gray-800/60 rounded-xl">
            <span className="text-indigo-500 text-4xl font-extrabold">2</span>
            <h4 className="mt-4 text-xl font-semibold">Chat with AI</h4>
            <p className="text-gray-400 mt-2">Tell BuzAI what your business needs.</p>
          </div>
          <div className="p-6 bg-gray-800/60 rounded-xl">
            <span className="text-indigo-500 text-4xl font-extrabold">3</span>
            <h4 className="mt-4 text-xl font-semibold">Grow Fast</h4>
            <p className="text-gray-400 mt-2">Get strategies, posts, and ideas instantly.</p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="mt-32 px-10 text-center">
        <h3 className="text-3xl font-bold">What Our Users Say</h3>
        <div className="relative mt-12 max-w-5xl mx-auto">
          <div ref={sliderRef} className="flex overflow-x-auto no-scrollbar scroll-smooth space-x-6">
            {[
  { name: "Sarah M.", text: "I used to spend $2000/month on agencies. With Buz AI I get better results!" },
  { name: "كريم ج.", text: "بصراحة بوز AI غيّر طريقة شغلي! صار التسويق أسهل والنتائج أوضح من قبل." },
  { name: "Toni L.", text: "Agencies disappear after a month, but Buz AI is always here helping me create and plan content." },
  { name: "ليلى س.", text: "كنت ضايعة شو أنشر ومتى، بس بوز AI صار يخططلي كل المحتوى بطريقة ذكية وسهلة." },
  { name: "Emily R.", text: "Instead of waiting for emails and meetings, I just type what I need and Buz AI delivers instantly." },
  { name: "عمر ن.", text: "وفّر علي وقت ومجهود كبير، كل أفكاري صارت جاهزة بخطوات بسيطة جداً." },
  { name: "Chloe M.", text: "I love how AI understands my business voice and creates content that feels authentic." },
  { name: "رنا خ.", text: "بوز AI فهم أسلوب علامتي التجارية من أول استخدام، والمحتوى بيطلع طبيعي كأني أنا كاتبته!" },
  { name: "Joe P.", text: "With agencies, I always felt left behind. With Buz AI, I feel supported every day!" },
  { name: "علي ك.", text: "ما كنت متوقع النتائج تكون بهالسرعة! تفاعل الناس زاد بشكل واضح من أول أسبوع." }
].map((review, i) => (
              <div key={i} className="min-w-[280px] md:min-w-[350px] bg-gray-800/60 p-6 rounded-2xl shadow-lg flex-shrink-0">
                <p className="italic text-gray-300 mb-4">“{review.text}”</p>
                <h4 className="font-semibold text-white">– {review.name}</h4>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => sliderRef.current.scrollBy({ left: -400, behavior: "smooth" })}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-600 transition"
          >
            ‹
          </button>
          <button
            onClick={() => sliderRef.current.scrollBy({ left: 400, behavior: "smooth" })}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-600 transition"
          >
            ›
          </button>
        </div>
      </section>

      {/* Optional CTA Banner */}
      <div className="bg-indigo-600 text-white text-center py-6 rounded-t-lg mt-12">
        <p className="font-semibold">Ready to upgrade your business in just $5?</p>
        <button
          onClick={() => router.push("/auth")}
          className="inline-block mt-2 px-6 py-3 bg-white text-indigo-600 rounded-full font-semibold hover:opacity-90 transition"
        >
          Start Now
        </button>
      </div>

      {/* FAQ */}
      <section id="faq" className="mt-32 px-10 max-w-4xl mx-auto">
        <h3 className="text-3xl font-bold text-center">Frequently Asked Questions</h3>
        <div className="mt-12 space-y-6">
          <div>
            <h4 className="text-xl font-semibold">Is BuzAI free to use?</h4>
            <p className="text-gray-400 mt-2">Yes — BuzAI offers a free plan so you can explore all its core features before upgrading to a full plan.</p>
          </div>
          <div>
            <h4 className="text-xl font-semibold">Can BuzAI replace a marketing team?</h4>
            <p className="text-gray-400 mt-2">Not entirely, but it gives you a strong head start and saves hours of work.</p>
          </div>
          <div>
            <h4 className="text-xl font-semibold">Do I need technical skills?</h4>
            <p className="text-gray-400 mt-2">No! Just chat with BuzAI like you would with a friend.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-32 py-10 text-center border-t border-gray-800">
        <p className="text-gray-500">© {new Date().getFullYear()} BuzAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
