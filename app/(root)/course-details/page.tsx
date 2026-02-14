import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Users,
  Award,
  BookOpen,
  PlayCircle,
  FileText,
  MessageCircle,
  Star,
  ChevronRight,
  Calendar,
  Target,
  Zap,
  Globe,
  Shield,
  TrendingUp,
} from "lucide-react";

export default function CourseDetailsPage() {
  const courses = [
    {
      id: 1,
      title: "Bitcoin Fundamentals",
      level: "Beginner",
      duration: "8 weeks",
      students: 234,
      rating: 4.9,
      reviews: 128,
      price: 299,
      image: "bg-gradient-to-br from-orange-500 to-yellow-500",
      description:
        "Master the fundamentals of Bitcoin, blockchain technology, and cryptocurrency investing.",
      modules: [
        "Introduction to Bitcoin and Blockchain",
        "How Bitcoin Transactions Work",
        "Bitcoin Wallets and Security",
        "Mining and Consensus Mechanisms",
        "Bitcoin as an Investment",
        "Future of Bitcoin",
      ],
    },
    {
      id: 2,
      title: "Ethereum Smart Contracts",
      level: "Intermediate",
      duration: "10 weeks",
      students: 189,
      rating: 4.8,
      reviews: 96,
      price: 399,
      image: "bg-gradient-to-br from-blue-500 to-purple-500",
      description:
        "Learn to build and deploy smart contracts on the Ethereum blockchain.",
      modules: [
        "Ethereum Fundamentals",
        "Solidity Programming",
        "Smart Contract Development",
        "Testing and Deployment",
        "DApp Development",
        "Security Best Practices",
      ],
    },
    {
      id: 3,
      title: "DeFi Mastery",
      level: "Advanced",
      duration: "12 weeks",
      students: 156,
      rating: 4.9,
      reviews: 82,
      price: 499,
      image: "bg-gradient-to-br from-green-500 to-teal-500",
      description:
        "Comprehensive guide to decentralized finance protocols and applications.",
      modules: [
        "Introduction to DeFi",
        "Lending and Borrowing Protocols",
        "Decentralized Exchanges",
        "Yield Farming Strategies",
        "Stablecoins and Liquidity Pools",
        "DeFi Risk Management",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-linear-to-r from-violet-600 to-blue-600 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Courses</h1>
            <p className="text-xl text-white/90 mb-8">
              Comprehensive cryptocurrency education for every skill level
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl">
                <span className="text-2xl font-bold block">20+</span>
                <span className="text-sm text-white/80">Expert Courses</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl">
                <span className="text-2xl font-bold block">500+</span>
                <span className="text-sm text-white/80">Students</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl">
                <span className="text-2xl font-bold block">4.9</span>
                <span className="text-sm text-white/80">Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section className="py-12 border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              "All Courses",
              "Beginner",
              "Intermediate",
              "Advanced",
              "Bitcoin",
              "Ethereum",
              "DeFi",
              "Trading",
            ].map((category) => (
              <button
                key={category}
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-violet-50 hover:text-violet-700 border border-gray-200"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {courses.map((course, index) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <div
                  className={`h-48 ${course.image} relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700">
                      {course.level}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {course.title}
                    </h2>
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{course.rating}</span>
                      <span className="text-gray-400 text-sm">
                        ({course.reviews})
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">{course.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      {course.students} students
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-violet-600" />
                      What you'll learn:
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {course.modules.slice(0, 4).map((module, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{module}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div>
                      <span className="text-3xl font-bold text-gray-900">
                        ${course.price}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        one-time
                      </span>
                    </div>
                    <Link
                      href={`/batches/${course.id}`}
                      className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
                    >
                      Enroll Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Path */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Learning <span className="text-violet-600">Journey</span>
            </h2>
            <p className="text-gray-600">
              Follow our structured learning path to become a cryptocurrency
              expert
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-violet-200 hidden lg:block"></div>

            <div className="space-y-12">
              {[
                {
                  step: "01",
                  title: "Bitcoin Fundamentals",
                  description:
                    "Start with the basics of Bitcoin and blockchain technology",
                  icon: Target,
                  color: "from-orange-500 to-yellow-500",
                },
                {
                  step: "02",
                  title: "Ethereum & Smart Contracts",
                  description:
                    "Advance to Ethereum and learn smart contract development",
                  icon: Zap,
                  color: "from-blue-500 to-purple-500",
                },
                {
                  step: "03",
                  title: "DeFi & Advanced Topics",
                  description:
                    "Master decentralized finance and advanced concepts",
                  icon: Globe,
                  color: "from-green-500 to-teal-500",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className={`lg:flex items-center gap-8 ${index % 2 === 0 ? "" : "lg:flex-row-reverse"}`}
                  >
                    <div className="lg:w-1/2">
                      <div
                        className={`bg-linear-to-r ${item.color} p-8 rounded-2xl text-white`}
                      >
                        <div className="text-4xl font-bold mb-2 opacity-50">
                          {item.step}
                        </div>
                        <h3 className="text-2xl font-bold mb-3">
                          {item.title}
                        </h3>
                        <p className="text-white/80">{item.description}</p>
                      </div>
                    </div>
                    <div className="lg:w-1/2 lg:flex justify-center hidden">
                      <div className="w-16 h-16 rounded-full bg-white border-4 border-violet-200 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-violet-600" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Do I need any prior experience?",
                a: "No, our courses are designed for all levels. We have beginner-friendly courses that start from the basics.",
              },
              {
                q: "How long do I have access to the course?",
                a: "You get lifetime access to all course materials, including future updates.",
              },
              {
                q: "Is there a certificate upon completion?",
                a: "Yes, you'll receive a verified certificate that you can share on LinkedIn and your resume.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept bKash, Nagad, Rocket, and Bank transfer for local students, and credit cards for international students.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
