Invoice Generation App - A ServiceM8 addon. 

This is an Invoice Generation App designed specifically made for my pest control work to generate invoices for my daily work. The app integrates with the ServiceM8 API to fetch job details, calculate pay, and generate professional invoices in PDF format. It simplifies the process of creating and sending invoices to employers by automating calculations and formatting.
Features

    Invoice Generation: Automatically generates invoices based on job details fetched from ServiceM8.

    Pay Calculation: Integrates with a previously built pay calculator module to calculate total pay for the day.

    Customizable Inputs: Allows users to input invoice details such as start date, end date, invoice number, and working hours.

    PDF Conversion: Converts rendered HTML (using EJS) into a PDF using browserless.io.

    Three-Step Process:

        Add invoice details (start date, end date, invoice number).

        Add working hours and calculate pay.

        Generate and view/download the invoice.

Technologies Used

    Backend: Node.js, Express.js

    Frontend: EJS (Embedded JavaScript Templates)

    API Integration: ServiceM8 API

    PDF Generation: browserless.io (as a workaround for Puppeteer)

    Hosting: Render (for hosting the web app)

    Pay Calculation Module: Custom module from a previous pay calculator app

    PDF Editing: External PDF editor for final adjustments

How It Works

    Fetch Job Details: The app fetches job details (client name, job ID, date, payment method) from the ServiceM8 API.

    Calculate Pay: The integrated pay calculator module calculates the total pay based on working hours.

    Render Invoice: The app uses EJS to render the invoice template with the fetched and calculated data.

    Convert to PDF: The rendered HTML is converted to PDF using browserless.io.

    Download/View Invoice: The generated PDF can be viewed or downloaded for further editing or sharing.

Challenges Faced

    Puppeteer and Render Hosting: Render does not have an inbuilt Chromium instance to run Puppeteer's headless browser. This was resolved by using browserless.io as a workaround.

    ServiceM8 API Requirements: ServiceM8 required the application to be publicly accessible, which led to hosting the app on Render.

    PDF Formatting: Fine-tuning the PDF layout and formatting required additional adjustments using an external PDF editor.

Installation and Setup

    Clone the Repository:
    bash
    Copy

    git clone https://github.com/your-username/invoice-generation-app.git
    cd invoice-generation-app

    Install Dependencies:
    bash
    Copy

    npm install

    Set Up Environment Variables:
    Create a .env file in the root directory and add the following:
    Copy

    SERVICEM8_API_KEY=your_servicem8_api_key
    BROWSERLESS_API_KEY=your_browserless_api_key

    Run the App:
    bash
    Copy

    npm start

    The app will be running at http://localhost:3000.

Usage

    This app requires a valid ServiceM8 account as it is developed as a part of ServiceM8 Addon. 
    
    Add Invoice Details:

        Enter the start date, end date, and invoice number in the provided form. The date format must be YYYY-MM-DD.

    Add Working Hours:

        Input your working hours as plain text to calculate your total pay for the days. The entries must be Day DD Month HH:MM am/pm to HH:MM am/pm format (e.g. Tuesday 28 Jan 7:25 am to 4:10 pm).


    Generate Invoice:

        Click "Generate Invoice" to create and view/download the PDF invoice.

Future Improvements

    Add support for multiple invoice templates.

    Implement user authentication for secure access.

    Add a feature to directly email invoices to employers.

    Improve PDF formatting and layout for better readability.

Contributing

Contributions are welcome! If you have any suggestions or improvements, feel free to open an issue or submit a pull request.
License

This project is licensed under the MIT License. See the LICENSE file for details.
Acknowledgments

    ServiceM8 for their API and support.

    browserless.io for providing a seamless solution for PDF generation.

    Render for hosting the application.

Feel free to reach out if you have any questions or need further assistance!
