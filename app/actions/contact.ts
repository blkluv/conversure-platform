"use server"

interface ContactFormData {
  name: string
  email: string
  phone: string
  identity: string
}

interface ContactFormResponse {
  success: boolean
  error?: string
}

export async function submitContactForm(data: ContactFormData): Promise<ContactFormResponse> {
  try {
    // Validate required fields
    if (!data.name || !data.email || !data.phone || !data.identity) {
      return {
        success: false,
        error: "All fields are required",
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        error: "Invalid email address",
      }
    }

    // Phone validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!phoneRegex.test(data.phone)) {
      return {
        success: false,
        error: "Invalid phone number",
      }
    }

    // Validate identity
    if (!["company", "agent"].includes(data.identity)) {
      return {
        success: false,
        error: "Invalid identity selection",
      }
    }

    // Log the contact form submission
    const identityLabel = data.identity === "company" ? "Real Estate Company" : "Individual Agent"
    
    console.log("=== NEW CONTACT FORM SUBMISSION ===")
    console.log("Timestamp:", new Date().toISOString())
    console.log("Name:", data.name)
    console.log("Email:", data.email)
    console.log("Phone:", data.phone)
    console.log("Identity:", identityLabel)
    console.log("Notification Email:", "abdallah@betaedgetech.com")
    console.log("===================================")

    // TODO: Integrate with email service (Resend, Nodemailer, etc.)
    // When ready, uncomment and configure:
    // 
    // await sendEmail({
    //   to: "abdallah@betaedgetech.com",
    //   subject: `New Demo Request from ${data.name} - Conversure`,
    //   html: `
    //     <h2>New Contact Form Submission - Conversure</h2>
    //     <p><strong>Name:</strong> ${data.name}</p>
    //     <p><strong>Email:</strong> ${data.email}</p>
    //     <p><strong>Phone:</strong> ${data.phone}</p>
    //     <p><strong>Identity:</strong> ${identityLabel}</p>
    //     <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    //     <hr />
    //     <p><small>This notification was sent to abdallah@betaedgetech.com</small></p>
    //   `,
    // })

    // Simulate a small delay (remove in production)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error submitting contact form:", error)
    return {
      success: false,
      error: "Failed to submit form. Please try again later.",
    }
  }
}
