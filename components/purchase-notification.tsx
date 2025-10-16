// components/purchase-notifications.tsx
"use client"

import { useState, useEffect } from "react"
import { X, ShoppingBag, MapPin, Verified, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import Image from "next/image"

// Indian names database for genuine randomization
const indianNames = {
  first: [
    "Aarav", "Aditi", "Akash", "Ananya", "Arjun", "Ayesha", "Dev", "Diya", 
    "Gaurav", "Ishaan", "Kavya", "Krishna", "Meera", "Naveen", "Neha", "Nikhil",
    "Pooja", "Pranav", "Priya", "Rahul", "Rajesh", "Riya", "Rohan", "Sakshi",
    "Sameer", "Sandeep", "Shreya", "Siddharth", "Simran", "Tanvi", "Varun", "Vivek",
    "Yash", "Zara", "Amit", "Anjali", "Deepak", "Divya", "Harsh", "Karan",
    "Manish", "Nidhi", "Pallavi", "Pankaj", "Ritika", "Rohit", "Shivam", "Sneha",
    "Suman", "Suresh", "Swati", "Tarun", "Tushar", "Vandana", "Vikas", "Vishal",
    "Aditya", "Ankit", "Ankita", "Arpit", "Ashish", "Bhavya", "Chetan", "Deepika",
    "Gautam", "Himanshu", "Isha", "Jatin", "Kajal", "Kunal", "Madhuri", "Mahesh",
    "Naman", "Nisha", "Parul", "Pratik", "Preeti", "Radhika", "Ravi", "Rekha",
    "Sachin", "Shubham", "Sonam", "Sonia", "Sunil", "Tanya", "Utkarsh", "Vinod"
  ],
  last: [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Mehta", "Patel", "Shah",
    "Agarwal", "Jain", "Reddy", "Nair", "Iyer", "Rao", "Chopra", "Khanna",
    "Malhotra", "Bansal", "Goel", "Mittal", "Joshi", "Pandey", "Mishra", "Tiwari",
    "Saxena", "Chauhan", "Yadav", "Thakur", "Rajput", "Srivastava", "Dubey", "Shukla",
    "Bhatia", "Arora", "Kohli", "Dhawan", "Kapoor", "Ahuja", "Sethi", "Tandon",
    "Bhatt", "Desai", "Joshi", "Pillai", "Menon", "Shetty", "Hegde", "Kulkarni"
  ]
}

// Cities for more authenticity
const indianCities = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
  "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Noida", "Gurgaon",
  "Chandigarh", "Kochi", "Coimbatore", "Mysore", "Nashik", "Faridabad", "Meerut", "kota", "Rajkot", "jaipur", "Udaipur", "Jodhpur", "Ajmer", "Alwar", "Bikaner", "Jaisalmer"
]

// Products list
const products = [
  { 
    id: "js", 
    name: "JavaScript Interview Preparation Kit", 
    shortName: "JS Kit",
    price: 79,
    color: "from-yellow-400 to-orange-400"
  },
//   { 
//     id: "react", 
//     name: "React Interview Preparation Kit", 
//     shortName: "React Kit",
//     price: 79,
//     color: "from-blue-400 to-cyan-400"
//   },
  { 
    id: "complete", 
    name: "Frontend Mastery Pro Interview Preparation Kit", 
    shortName: "Frontend Mastery Kit",
    price: 149,
    color: "from-purple-400 to-pink-400"
  },
    { 
    id: "complete", 
    name: "Complete Frontend Interview Preparation Kit", 
    shortName: "Complete Kit",
    price: 99,
    color: "from-purple-400 to-pink-400"
  },
//   { 
//     id: "node", 
//     name: "Node.js Interview Kit", 
//     shortName: "Node.js Kit",
//     price: 89,
//     color: "from-green-400 to-emerald-400"
//   }
]

// Time variations for authenticity
const timeVariations = [
  "just now",
  "2 mins ago",
  "5 mins ago",
  "8 mins ago",
  "12 mins ago",
  "15 mins ago",
  "18 mins ago",
  "22 mins ago",
  "25 mins ago",
  "30 mins ago"
]

interface NotificationData {
  id: string
  name: string
  city: string
  product: typeof products[0]
  time: string
  verified?: boolean
}

export function PurchaseNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null)
  const [lastShownNames, setLastShownNames] = useState<Set<string>>(new Set())

  // Generate random notification data
  const generateNotification = (): NotificationData => {
    // Get random names ensuring no recent duplicates
    let firstName, lastName, fullName
    do {
      firstName = indianNames.first[Math.floor(Math.random() * indianNames.first.length)]
      lastName = indianNames.last[Math.floor(Math.random() * indianNames.last.length)]
      fullName = `${firstName} ${lastName}`
    } while (lastShownNames.has(fullName))

    // Update last shown names (keep only last 20 to avoid memory issues)
    const updatedNames = new Set(lastShownNames)
    updatedNames.add(fullName)
    if (updatedNames.size > 20) {
      const firstItem = updatedNames.values().next().value
      updatedNames.delete(firstItem)
    }
    setLastShownNames(updatedNames)

    const city = indianCities[Math.floor(Math.random() * indianCities.length)]
    const product = products[Math.floor(Math.random() * products.length)]
    const time = timeVariations[Math.floor(Math.random() * Math.min(3, timeVariations.length))] // Prefer recent times
    const verified = Math.random() > 0.3 // 70% chance of being verified

    return {
      id: `${Date.now()}-${Math.random()}`,
      name: fullName,
      city,
      product,
      time,
      verified
    }
  }

  // Show notification every 10-15 seconds (randomized for authenticity)
  useEffect(() => {
    const showNotification = () => {
      const notification = generateNotification()
      setCurrentNotification(notification)
      setIsVisible(true)

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          setCurrentNotification(null)
        }, 300) // Wait for animation to complete
      }, 4000)
    }

    // Initial delay of 5 seconds
    const initialTimer = setTimeout(() => {
      showNotification()
      
      // Then show every 10-15 seconds (randomized)
      const interval = setInterval(() => {
        showNotification()
      }, Math.random() * 5000 + 15000) // 10-15 seconds

      // Cleanup interval on unmount
      return () => clearInterval(interval)
    }, 5000)

    return () => clearTimeout(initialTimer)
  }, [])

  const getRandomViewers = ()=>{
    return 23
    // return Math.floor(Math.random() * 20) + 5
  } // 5 to 25 viewers

  if (!currentNotification) return null

  return (
    <>
      {/* Desktop Notification - Bottom Left */}
      <div
        className={`
          fixed bottom-20 left-6 z-40 hidden sm:block
          transform transition-all duration-500 ease-out
          ${isVisible 
            ? 'translate-x-0 opacity-100 scale-100' 
            : '-translate-x-full opacity-0 scale-95'
          }
        `}
      >
        <Card className="relative p-4 pr-10 bg-white border-2 shadow-2xl max-w-sm hover:scale-105 transition-transform cursor-pointer">
          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          {/* Gradient accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentNotification.product.color}`} />

          <div className="flex items-start gap-3">
            {/* Icon with pulse animation */}
            <div className="relative">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${currentNotification.product.color} flex items-center justify-center`}>
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <p className="font-semibold text-sm text-gray-900">
                  {currentNotification.name}
                </p>
                {currentNotification.verified && (
                  <Verified className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                )}
              </div>
              
              <p className="text-xs text-gray-600 mb-1">
                just purchased <span className="font-semibold text-gray-900">{currentNotification.product.shortName}</span>
              </p>
              
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {currentNotification.city}
                </span>
                <span>{currentNotification.time}</span>
              </div>
            </div>

            {/* Price badge */}
            <div className="text-right">
              <div className="text-xs text-gray-500 line-through">₹{(currentNotification.product.price + 1) * 10 - 1}</div>
              <div className="text-sm font-bold text-green-600">₹{currentNotification.product.price}</div>
            </div>
          </div>

          {/* Bottom action hint */}
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>{getRandomViewers()} others viewing this</span>
            </div>
            <span className="text-[10px] text-blue-600 font-semibold">View Kit →</span>
          </div>
        </Card>
      </div>

      {/* Mobile Notification - Top, below header */}
      <div
        className={`
          fixed top-16 left-2 right-2 z-40 sm:hidden
          transform transition-all duration-500 ease-out
          ${isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : '-translate-y-full opacity-0 scale-95'
          }
        `}
      >
        <Card className="relative p-3 bg-white border shadow-xl">
          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 p-1"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>

          {/* Gradient accent */}
          <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${currentNotification.product.color}`} />

          <div className="flex items-center gap-2">
            {/* Icon */}
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentNotification.product.color} flex items-center justify-center flex-shrink-0`}>
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-semibold text-xs text-gray-900 truncate">
                  {currentNotification.name}
                </p>
                {currentNotification.verified && (
                  <Verified className="w-3 h-3 text-blue-500 fill-blue-500 flex-shrink-0" />
                )}
              </div>
              
              <p className="text-[10px] text-gray-600">
                purchased <span className="font-semibold">{currentNotification.product.name}</span>
              </p>
            </div>

            {/* Time */}
            <span className="text-[10px] text-gray-500 flex-shrink-0">
              {currentNotification.time}
            </span>
          </div>
        </Card>
      </div>
    </>
  )
}