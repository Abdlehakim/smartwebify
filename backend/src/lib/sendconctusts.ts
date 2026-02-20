export function contactFormTemplate(
    name: string,
    email: string,
    text: string
  ): string {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Us</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f9;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #fff;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          h1 {
              text-align: center;
              color: #333;
          }
      </style>
  </head>
  <body>
  
      <div class="container">
          <h1>Contact Us</h1>
          <h2>Name: ${name}</h2>
          <h2>Email: ${email}</h2>
          <h3>Message:</h3>
          <p>${text}</p>
      </div>
  
  </body>
  </html>
    `;
  }
  