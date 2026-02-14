import Link from "next/link";
import { getPublicBatchesAction } from "@/actions/batch.actions";
import {
  ArrowRight,
  Star,
  Users,
  BookOpen,
  Award,
  CheckCircle,
  PlayCircle,
  Sparkles,
  Globe,
  GraduationCap,
  Target,
  BarChart3,
  Wallet,
  Lock,
  Rocket,
} from "lucide-react";
import { EnrolmentCard } from "@/components/app/enrolment-card";

export default async function HomePage() {
  const batches = await getPublicBatchesAction();

  // Find an ongoing enrollment batch (if any)
  const ongoingBatch = batches.find((batch) => {
    const now = new Date();
    const start = new Date(batch.enrollStart);
    const end = new Date(batch.enrollEnd);
    return batch.isOpen && now >= start && now <= end && batch.seats > 0;
  });

  // Stats for the page
  const stats = {
    students: 2500,
    courses: 24,
    instructors: 18,
    satisfaction: 98,
    countries: 45,
    projects: 120,
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-violet-50/30">
      {/* Floating Enrollment Card - Only shown if there's an ongoing batch */}
      {ongoingBatch && <EnrolmentCard batch={ongoingBatch} />}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-32">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-violet-200 rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 animate-pulse-slow delay-1000"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span>Trusted by 2,500+ Students Worldwide</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Master{" "}
              <span className="bg-linear-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                Cryptocurrency
              </span>
              <br />& Blockchain Technology
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join the largest crypto education platform in Bangladesh. Learn
              from industry experts, build real projects, and start your career
              in Web3.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/batches"
                className="group px-8 py-4 bg-linear-to-r from-violet-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="flex items-center gap-2">
                  Explore All Courses
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/course-details"
                className="group px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-violet-600" />
                  Watch Free Intro
                </span>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-linear-to-br from-violet-400 to-blue-400 border-2 border-white shadow-sm"
                      style={{
                        backgroundImage: `url(https://i.pravatar.cc/100?img=${i})`,
                        backgroundSize: "cover",
                      }}
                    ></div>
                  ))}
                </div>
                <span className="font-medium">
                  {stats.students}+ students enrolled
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
                <span className="font-medium ml-2">
                  4.9/5 rating (1.2k+ reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image/Graphic */}
        <div className="container mx-auto px-4 mt-20">
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-linear-to-r from-violet-500 to-blue-500 rounded-3xl opacity-10 blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200 p-8 shadow-2xl">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-violet-50 transition-colors">
                  <div className="p-3 bg-violet-100 rounded-xl">
                    <GraduationCap className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.courses}+
                    </p>
                    <p className="text-sm text-gray-500">Expert Courses</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50 transition-colors">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.instructors}
                    </p>
                    <p className="text-sm text-gray-500">Expert Instructors</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-green-50 transition-colors">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.satisfaction}%
                    </p>
                    <p className="text-sm text-gray-500">Satisfaction Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 border-y border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, label: "2,500+", desc: "Active Students" },
              { icon: BookOpen, label: "24", desc: "Expert Courses" },
              { icon: Globe, label: "45+", desc: "Countries" },
              { icon: Award, label: "98%", desc: "Success Rate" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center group">
                  <div className="inline-flex p-3 bg-violet-50 rounded-xl mb-3 group-hover:bg-violet-100 transition-colors">
                    <Icon className="h-6 w-6 text-violet-600" />
                  </div>
                  <div className="font-bold text-2xl text-gray-900">
                    {stat.label}
                  </div>
                  <div className="text-sm text-gray-500">{stat.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to{" "}
              <span className="text-violet-600">Succeed</span>
            </h2>
            <p className="text-gray-600">
              Comprehensive learning platform designed to take you from beginner
              to professional
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Structured Curriculum",
                desc: "Step-by-step learning paths designed by industry experts",
              },
              {
                icon: Users,
                title: "Community Support",
                desc: "Connect with fellow learners, share knowledge, and grow together",
              },
              {
                icon: BarChart3,
                title: "Real Projects",
                desc: "Build real-world projects to add to your portfolio",
              },
              {
                icon: Wallet,
                title: "Trading Simulator",
                desc: "Practice trading with our risk-free simulator",
              },
              {
                icon: Lock,
                title: "Lifetime Access",
                desc: "Access course materials forever, including future updates",
              },
              {
                icon: Rocket,
                title: "Career Support",
                desc: "Resume reviews, interview prep, and job placement assistance",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-violet-200 transition-all duration-300 group"
                >
                  <div className="p-3 bg-violet-50 rounded-xl w-fit mb-4 group-hover:bg-violet-100 transition-colors">
                    <Icon className="h-6 w-6 text-violet-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Learning Path Preview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Your Journey to{" "}
                <span className="text-violet-600">Blockchain Mastery</span>
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Our carefully crafted learning paths take you from absolute
                beginner to blockchain professional, with hands-on projects at
                every stage.
              </p>

              <div className="space-y-6">
                {[
                  {
                    step: "01",
                    title: "Bitcoin Fundamentals",
                    desc: "Start with the basics of Bitcoin, blockchain technology, and cryptocurrency investing",
                  },
                  {
                    step: "02",
                    title: "Ethereum & Smart Contracts",
                    desc: "Master Solidity programming and build your first decentralized applications",
                  },
                  {
                    step: "03",
                    title: "DeFi & Advanced Topics",
                    desc: "Explore DeFi protocols, yield farming, and advanced blockchain concepts",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/course-details"
                className="inline-flex items-center gap-2 mt-8 text-violet-600 font-semibold hover:text-violet-700 transition-colors group"
              >
                View Full Curriculum
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-violet-500 to-blue-500 rounded-3xl opacity-10 blur-3xl"></div>
              <div className="relative bg-white rounded-2xl border border-gray-200 p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-400 ml-2">
                    Sample Curriculum
                  </span>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <PlayCircle className="h-5 w-5 text-violet-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Module {i}: Getting Started
                        </p>
                        <p className="text-xs text-gray-500">
                          12 lessons • 2 hours
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our <span className="text-violet-600">Students</span> Say
            </h2>
            <p className="text-gray-600">
              Join thousands of satisfied students who have transformed their
              careers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Ahmed",
                role: "Bitcoin Fundamentals",
                content:
                  "The Bitcoin course was incredibly comprehensive. I went from knowing nothing to confidently investing and understanding the technology behind it.",
                rating: 5,
                avatar: "SA",
              },
              {
                name: "Rafiq Islam",
                role: "Ethereum Developer",
                content:
                  "The smart contracts course is hands-down the best online. The instructor explains complex concepts in a way that's easy to understand.",
                rating: 5,
                avatar: "RI",
              },
              {
                name: "Nusrat Jahan",
                role: "DeFi Mastery",
                content:
                  "I was able to start my DeFi journey and now I'm actively participating in various protocols. The community support is amazing!",
                rating: 5,
                avatar: "NJ",
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/student-feedback"
              className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:text-violet-700 transition-colors group"
            >
              Read More Success Stories
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Do I need any prior experience?",
                a: "No, our courses are designed for all levels. We have beginner-friendly courses that start from the basics and gradually advance to complex topics.",
              },
              {
                q: "How long do I have access to the course?",
                a: "You get lifetime access to all course materials, including future updates. Learn at your own pace, anytime, anywhere.",
              },
              {
                q: "Is there a certificate upon completion?",
                a: "Yes, you'll receive a verified certificate that you can share on LinkedIn and your resume. Our certificates are recognized by employers.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept bKash, Nagad, Rocket, and Bank transfer for local students. International students can pay via credit card or cryptocurrency.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:text-violet-700 transition-colors group"
            >
              View All FAQs
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-violet-600 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join 2,500+ students already learning on Crypto Hub. Get started
            today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/batches"
              className="px-8 py-4 bg-white text-violet-600 rounded-xl font-semibold hover:shadow-xl hover:shadow-violet-300/30 transition-all duration-300 transform hover:-translate-y-1"
            >
              Browse Courses
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
