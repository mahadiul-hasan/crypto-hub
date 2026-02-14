import {
  Star,
  Quote,
  ThumbsUp,
  MessageCircle,
  Share2,
  Calendar,
  User,
  Filter,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function StudentFeedbackPage() {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Ahmed",
      role: "Bitcoin Fundamentals Graduate",
      avatar: "SA",
      rating: 5,
      date: "March 2024",
      content:
        "Crypto Hub completely transformed my understanding of Bitcoin. The instructors are incredibly knowledgeable and the course material is well-structured. I've already started my own crypto portfolio!",
      course: "Bitcoin Fundamentals",
      likes: 45,
      comments: 12,
      image: "bg-linear-to-br from-orange-100 to-yellow-100",
    },
    {
      id: 2,
      name: "Rafiq Islam",
      role: "Ethereum Developer",
      avatar: "RI",
      rating: 5,
      date: "February 2024",
      content:
        "The Ethereum Smart Contracts course was exactly what I needed to level up my blockchain development skills. The hands-on projects and real-world examples made learning Solidity fun and practical.",
      course: "Ethereum Smart Contracts",
      likes: 38,
      comments: 8,
      image: "bg-linear-to-br from-blue-100 to-purple-100",
    },
    {
      id: 3,
      name: "Nusrat Jahan",
      role: "DeFi Enthusiast",
      avatar: "NJ",
      rating: 5,
      date: "January 2024",
      content:
        "I was intimidated by DeFi at first, but this course made it so accessible. Now I'm actively participating in yield farming and liquidity pools. Best investment in my education!",
      course: "DeFi Mastery",
      likes: 52,
      comments: 15,
      image: "bg-linear-to-br from-green-100 to-teal-100",
    },
    {
      id: 4,
      name: "Tanvir Hossain",
      role: "Crypto Trader",
      avatar: "TH",
      rating: 4,
      date: "December 2023",
      content:
        "The trading strategies I learned here have helped me consistently profit in both bull and bear markets. The community support is amazing too!",
      course: "Advanced Trading Strategies",
      likes: 29,
      comments: 6,
      image: "bg-linear-to-br from-purple-100 to-pink-100",
    },
    {
      id: 5,
      name: "Farhana Akter",
      role: "Blockchain Researcher",
      avatar: "FA",
      rating: 5,
      date: "November 2023",
      content:
        "As someone with a technical background, I appreciated the depth of the blockchain fundamentals course. The instructors answered all my questions and provided additional resources.",
      course: "Blockchain Fundamentals",
      likes: 41,
      comments: 9,
      image: "bg-linear-to-br from-indigo-100 to-blue-100",
    },
    {
      id: 6,
      name: "Shahriar Kabir",
      role: "NFT Artist",
      avatar: "SK",
      rating: 5,
      date: "October 2023",
      content:
        "The NFT creation and marketing course opened up a whole new career path for me. I've already sold my first collection!",
      course: "NFT Creation & Marketing",
      likes: 63,
      comments: 21,
      image: "bg-linear-to-br from-pink-100 to-rose-100",
    },
  ];

  const ratings = {
    average: 4.9,
    total: 587,
    distribution: [412, 98, 45, 22, 10], // 5 stars, 4 stars, 3 stars, 2 stars, 1 star
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-linear-to-r from-violet-600 to-blue-600 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Student <span className="text-yellow-300">Feedback</span>
            </h1>
            <p className="text-xl text-white/90 mb-8">
              See what our students have to say about their learning journey
            </p>
          </div>
        </div>
      </section>

      {/* Overall Rating Section */}
      <section className="py-12 border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Average Rating */}
              <div className="text-center md:text-left">
                <div className="text-6xl font-bold text-gray-900 mb-2">
                  {ratings.average}
                </div>
                <div className="flex justify-center md:justify-start gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= Math.floor(ratings.average)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-500">
                  Based on {ratings.total} reviews
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star, index) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-8">
                      {star} star
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{
                          width: `${(ratings.distribution[index] / ratings.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12">
                      {ratings.distribution[index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium">
                All Reviews
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                With Photos
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                With Comments
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option>Most Recent</option>
                <option>Highest Rated</option>
                <option>Most Helpful</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header with linear */}
                <div className={`h-24 ${testimonial.image} relative`}>
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-white/30" />
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* User info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {testimonial.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= testimonial.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {testimonial.date}
                    </span>
                  </div>

                  {/* Testimonial text */}
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    "{testimonial.content}"
                  </p>

                  {/* Course tag */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                      {testimonial.course}
                    </span>
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600 transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{testimonial.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>{testimonial.comments}</span>
                    </button>
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600 transition-colors ml-auto">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl hover:border-violet-300 hover:text-violet-600 transition-colors font-medium">
              Load More Reviews
            </button>
          </div>
        </div>
      </section>

      {/* Write a Review Section */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Share Your Experience
          </h2>
          <p className="text-gray-600 mb-8">
            Help others make informed decisions by sharing your learning journey
          </p>
          <Link
            href="/auth/login?redirect=/student-feedback"
            className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-semibold"
          >
            Write a Review
            <MessageCircle className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
