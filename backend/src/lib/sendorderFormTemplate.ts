
export function orderFormTemplate(
  name: string,
  email: string,
  items: Array<{ refProduct: string; name:string;price: number; quantity: number;discount:number }>,
  ref:string,
  fee:number,
  total:number,
  date:string,
  namecomapny:string,
  emailcompany:string,
  phonecompany:string,
  companyaddress:string,
  companycity:string,
  companygov:string,
  companyzip:string,
): string {
  const parsedDate = new Date(date);

  // Format the date to dd-mm-yyyy
  const day = String(parsedDate.getDate()).padStart(2, '0');
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = parsedDate.getFullYear();

  const formattedDate = `${day}-${month}-${year}`;
    // Generate the HTML for the items
    const itemsHtml = items
    .map((item) => {
      // Calculate discount if applicable
      const discountAmount = item.discount > 0 ? (item.price * item.discount) / 100 : 0;
      // Calculate the final price after discount
      const finalPrice = item.price - discountAmount;
      // Calculate total price for the quantity
      const totalPrice = finalPrice * item.quantity;

      return `
        <tr>
          <td class="td-line-item" style="color: #555; padding: 10px 0; font-family: helvetica; border-bottom: 1px solid #ddd">${item.name}</td>
          <td class="td-line-item nowrap" align="left" style="color: #555; padding: 10px 0; font-family: helvetica; border-bottom: 1px solid #ddd; white-space: nowrap">${item.quantity}</td>
          <td class="td-line-item nowrap" align="right" style="color: #555; padding: 10px 0; font-family: helvetica; border-bottom: 1px solid #ddd; white-space: nowrap">${finalPrice.toFixed(2)} DT </td>
          <td class="td-line-item nowrap" align="right" style="color: #555; padding: 10px 0; font-family: helvetica; border-bottom: 1px solid #ddd; white-space: nowrap">${totalPrice.toFixed(2)} DT </td>
        </tr>
      `;
    })
    .join('');
  return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <title></title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />

    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style type="text/css">
      #outlook a {
        padding: 0;
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table,
      td {
        border-collapse: collapse;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
        -ms-interpolation-mode: bicubic;
      }
      p {
        display: block;
        margin: 13px 0;
      }
     .toptext{
        margin: 13px 0 0 20px;
      }
    </style>
    
    <style type="text/css">
      @media only screen and (min-width: 480px) {
        .mj-column-per-100 {
          width: 100% !important;
          max-width: 100%;
        }
      }
    </style>
    <style media="screen and (min-width:480px)">
      .moz-text-html .mj-column-per-100 {
        width: 100% !important;
        max-width: 100%;
      }
    </style>
    <style type="text/css"></style>
    <style type="text/css">
      .invoice-word {
        font-size: 30px;
      }
      @media only screen and (max-width: 480px) {
        .invoice-word {
          font-size: 24px;
          text-align: right;
        }
      }
    </style>
  </head>
  <body style="word-spacing: normal">
    <div>
      <div style="margin: 0px auto; max-width: 600px">
      <div >
		<p class="toptext">
		<span style="font-weight: bold">Dear  ${name},</span> <br/>
Thank you for your order on ${namecomapny} from ${formattedDate}
Following your successful order, 
		</p>
		</div>
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%">
          <tbody>
            <tr>
              <td style="direction: ltr; font-size: 0px; padding: 20px 0; padding-bottom: 10px; padding-top: 40px; text-align: center">
               
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align: top" width="100%">
                    <tbody>
                      <tr>
                        <td align="left" style="font-size: 0px; padding: 10px 25px; padding-bottom: 5px; word-break: break-word">
                          <table cellpadding="0" cellspacing="0" width="100%" border="0" style="color: #000000; font-family: Helvetica, Arial, sans-serif; font-size: 13px; line-height: 22px; table-layout: auto; width: 100%; border: none">
                            <tr>
                              <td style="width: 50%">
                             <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="241" height="45">
<path d="M0 0 C5.94 0 11.88 0 18 0 C18 1.32 18 2.64 18 4 C23.94 4 29.88 4 36 4 C36 13.57 36 23.14 36 33 C30.06 33 24.12 33 18 33 C18 31.68 18 30.36 18 29 C12.06 29 6.12 29 0 29 C0 19.43 0 9.86 0 0 Z M8 5 C8 10.28 8 15.56 8 21 C8.33 21 8.66 21 9 21 C9 16.05 9 11.1 9 6 C11.97 6 14.94 6 18 6 C18 5.67 18 5.34 18 5 C14.7 5 11.4 5 8 5 Z M11 8 C11 9.32 11 10.64 11 12 C13.31 12 15.62 12 18 12 C18 12.66 18 13.32 18 14 C15.69 14 13.38 14 11 14 C11 15.65 11 17.3 11 19 C13.31 19 15.62 19 18 19 C18 19.66 18 20.32 18 21 C20.31 21 22.62 21 25 21 C25.268125 19.865625 25.53625 18.73125 25.8125 17.5625 C26.4003125 15.7990625 26.4003125 15.7990625 27 14 C27.99 13.67 28.98 13.34 30 13 C29.67 11.35 29.34 9.7 29 8 C23.06 8 17.12 8 11 8 Z M29 15 C28.34 17.31 27.68 19.62 27 22 C22.545 22.495 22.545 22.495 18 23 C18 24.65 18 26.3 18 28 C21.3 28 24.6 28 28 28 C28.33 28.66 28.66 29.32 29 30 C29 29.34 29 28.68 29 28 C30.32 28 31.64 28 33 28 C34.18306728 25.63386544 34.13354608 24.13219264 34.125 21.5 C34.12757812 20.7059375 34.13015625 19.911875 34.1328125 19.09375 C34.13277996 16.94081466 34.13277996 16.94081466 33 15 C31.68 15 30.36 15 29 15 Z M11 21 C11 22.65 11 24.3 11 26 C13.18490007 23.32357511 13.18490007 23.32357511 13 21 C12.34 21 11.68 21 11 21 Z " fill="#000000" transform="translate(18,6)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5.83848804 1.45537568 6.67063934 2.91440373 7.5 4.375 C8.19609375 5.59316406 8.19609375 5.59316406 8.90625 6.8359375 C10 9 10 9 10 11 C10.66 11 11.32 11 12 11 C12.268125 10.113125 12.53625 9.22625 12.8125 8.3125 C13.94755607 5.14629095 14.907481 2.63502393 17 0 C18.65 0 20.3 0 22 0 C22 7.26 22 14.52 22 22 C20.35 22 18.7 22 17 22 C16.67 19.03 16.34 16.06 16 13 C15.34 14.32 14.68 15.64 14 17 C11.6875 17.3125 11.6875 17.3125 9 17 C7.1875 14.5 7.1875 14.5 6 12 C5.67 15.3 5.34 18.6 5 22 C3.35 22 1.7 22 0 22 C0 14.74 0 7.48 0 0 Z " fill="#000000" transform="translate(180,12)"/>
<path d="M0 0 C2.92956358 4.07377023 2.75315797 8.75814496 2 13.5625 C0.80515822 16.58189747 0.15900504 17.45003302 -2.5625 19.375 C-7.03859568 20.9212876 -10.48169602 21.02430423 -15 19.5625 C-18.42188142 16.83896173 -19.64150457 15.39053041 -20.47265625 11.15234375 C-20.73005518 6.77656195 -20.48767681 3.52837228 -17.75 0 C-12.24069414 -4.88324838 -5.68056447 -4.61545863 0 0 Z M-13.875 2.5625 C-15.68523932 5.78070324 -15.53967465 8.96466898 -15 12.5625 C-14.03882095 14.69120693 -14.03882095 14.69120693 -12 15.5625 C-8.91184125 15.94851984 -6.89815624 16.04151666 -4.125 14.5625 C-2.31476068 11.34429676 -2.46032535 8.16033102 -3 4.5625 C-3.96117905 2.43379307 -3.96117905 2.43379307 -6 1.5625 C-9.08815875 1.17648016 -11.10184376 1.08348334 -13.875 2.5625 Z " fill="#000000" transform="translate(175,14.4375)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5 2.64 5 5.28 5 8 C7.64 8 10.28 8 13 8 C13 5.36 13 2.72 13 0 C14.65 0 16.3 0 18 0 C18 7.26 18 14.52 18 22 C16.35 22 14.7 22 13 22 C13 19.03 13 16.06 13 13 C10.36 13 7.72 13 5 13 C5 15.97 5 18.94 5 22 C3.35 22 1.7 22 0 22 C0 14.74 0 7.48 0 0 Z " fill="#000000" transform="translate(134,12)"/>
<path d="M0 0 C1.65 0 3.3 0 5 0 C5.33 5.61 5.66 11.22 6 17 C7.65 17 9.3 17 11 17 C11.33 11.39 11.66 5.78 12 0 C13.98 0 15.96 0 18 0 C18.57597305 15.38061377 18.57597305 15.38061377 15 21 C12.9781185 22.797228 11.73736162 22.99104419 9.0703125 23.0234375 C3.76873457 22.65446321 3.76873457 22.65446321 1.265625 20.5234375 C-0.669145 16.66584053 -0.31690941 12.99728325 -0.1875 8.75 C-0.17396484 7.90953125 -0.16042969 7.0690625 -0.14648438 6.203125 C-0.11123464 4.13514062 -0.0574302 2.06748729 0 0 Z " fill="#000000" transform="translate(75,12)"/>
<path d="M0 0 C4.95 0 9.9 0 15 0 C15 1.32 15 2.64 15 4 C11.7 4 8.4 4 5 4 C5 5.32 5 6.64 5 8 C7.97 8 10.94 8 14 8 C14 9.65 14 11.3 14 13 C11.03 13 8.06 13 5 13 C5 14.65 5 16.3 5 18 C8.3 18 11.6 18 15 18 C15 19.32 15 20.64 15 22 C10.05 22 5.1 22 0 22 C0 14.74 0 7.48 0 0 Z " fill="#000000" transform="translate(206,12)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C6.66 1.98 7.32 3.96 8 6 C8.66 6 9.32 6 10 6 C10.66 4.02 11.32 2.04 12 0 C13.98 0 15.96 0 18 0 C17.58105469 0.68964844 17.16210938 1.37929687 16.73046875 2.08984375 C13.52200551 7.60027941 13.52200551 7.60027941 13.78125 13.6640625 C15.14194545 16.06710118 15.14194545 16.06710118 16.73046875 18.22265625 C18 20 18 20 18 22 C16.02 22 14.04 22 12 22 C11.01 20.02 10.02 18.04 9 16 C8.1646875 17.485 8.1646875 17.485 7.3125 19 C5 22 5 22 2.25 22.375 C1.5075 22.25125 0.765 22.1275 0 22 C1.05875074 18.59687262 2.00902154 15.98646769 4 13 C3.70933201 8.54309079 2.37626235 5.71936715 0 2 C0 1.34 0 0.68 0 0 Z " fill="#000000" transform="translate(95,12)"/>
<path d="M0 0 C4.62 0 9.24 0 14 0 C14 1.32 14 2.64 14 4 C11.03 4 8.06 4 5 4 C5 5.32 5 6.64 5 8 C7.97 8 10.94 8 14 8 C14 9.65 14 11.3 14 13 C11.03 13 8.06 13 5 13 C5 14.65 5 16.3 5 18 C7.97 18 10.94 18 14 18 C14 19.32 14 20.64 14 22 C9.38 22 4.76 22 0 22 C0 14.74 0 7.48 0 0 Z " fill="#000000" transform="translate(116,12)"/>
<path d="M0 0 C1.98 0 3.96 0 6 0 C6 5.94 6 11.88 6 18 C8.97 18 11.94 18 15 18 C15 19.32 15 20.64 15 22 C10.05 22 5.1 22 0 22 C0 14.74 0 7.48 0 0 Z " fill="#000000 " transform="translate(58,12)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 0.66 3 1.32 3 2 C2.01 2 1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#000000 " transform="translate(33,21)"/>
<path d="M0 0 C0.99 0 1.98 0 3 0 C3 0.66 3 1.32 3 2 C2.01 2 1.02 2 0 2 C0 1.34 0 0.68 0 0 Z " fill="#000000 " transform="translate(33,15)"/>
</svg>
                              </td>
                              <td style="width: 50%"><div class="invoice-word" style="font-family: helvetica; color: #333; font-weight: bold"> Order </div></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
          
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin: 0px auto; max-width: 600px">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%">
          <tbody>
            <tr>
              <td style="direction: ltr; font-size: 0px; padding: 20px 0; padding-bottom: 0; padding-top: 0; text-align: center">
               
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align: top" width="100%">
                    <tbody>
                      <tr>
                        <td align="center" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                          <p style="border-top: solid 1px #dddddd; font-size: 1px; margin: 0px auto; width: 100%"></p>
                         
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin: 0px auto; max-width: 600px">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%">
          <tbody>
            <tr>
              <td style="direction: ltr; font-size: 0px; padding: 20px 0; padding-bottom: 0; padding-top: 0; text-align: center">
         
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align: top" width="100%">
                    <tbody>
                      <tr>
                        <td align="left" style="font-size: 0px; padding: 10px 25px; padding-top: 5px; padding-bottom: 5px; word-break: break-word">
                          <table cellpadding="0" cellspacing="0" width="100%" border="0" style="color: #000000; font-family: Helvetica, Arial, sans-serif; font-size: 13px; line-height: 22px; table-layout: auto; width: 100%; border: none">
                            <tr>
                              <td>
                                <div style="font-family: helvetica">
                                  <span style="color: #333"><strong>Order Numer:</strong></span>
                                  <span style="color: #555; white-space: nowrap">#${ref.replace("ORDER-", "")}</span>
                                </div>
                              </td>
                              <td width="50%">
                                <div style="font-family: helvetica">
                                  <span style="color: #333"><strong>Date Issued:</strong></span>
                                  <span style="color: #555; white-space: nowrap">${formattedDate}</span>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
             
              </td>
            </tr>
          </tbody>
        </table>
      </div>
     
      <div style="margin: 0px auto; max-width: 600px">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%">
          <tbody>
            <tr>
              <td style="direction: ltr; font-size: 0px; padding: 20px 0; padding-bottom: 0; padding-top: 0; text-align: center">
              
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align: top" width="100%">
                    <tbody>
                      <tr>
                        <td align="center" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                          <p style="border-top: solid 1px #dddddd; font-size: 1px; margin: 0px auto; width: 100%"></p>
                          
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
               
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style="margin: 0px auto; max-width: 600px">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%">
          <tbody>
            <tr>
              <td style="direction: ltr; font-size: 0px; padding: 20px 0; padding-top: 10px; text-align: center">
               
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align: top" width="100%">
                    <tbody>
                      <tr>
                        <td align="left" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                          <table cellpadding="0" cellspacing="0" width="100%" border="0" style="color: #000000; font-family: Helvetica, Arial, sans-serif; font-size: 13px; line-height: 22px; table-layout: auto; width: 100%; border: none">
                            <tr>
                              <td style="vertical-align: top">
                                <div class="company-info-header" style="color: #333; font-family: helvetica"><strong>Bill To:</strong></div>
                                ${name}
                                <div class="company-info" style="color: #555; font-family: helvetica">${email}</div>
                                
                              </td>
                              <td width="50%" v-align="top" style="vertical-align: top">
                                <div class="company-info-header" style="color: #333; font-family: helvetica"><strong>Bill From:</strong></div>
                                <div class="company-info" style="color: #555; font-family: helvetica">${namecomapny}</div>
                                
                               
                                <div class="company-info" style="color: #555; font-family: helvetica">${companyaddress}</div>
                                <div class="company-info" style="color: #555; font-family: helvetica">${companyzip}, ${companycity}</div>
                                <div class="company-info" style="color: #555; font-family: helvetica">${companygov}</div>
                                <div class="company-info" style="color: #555; font-family: helvetica">Phone: ${phonecompany}</div>
                                <div class="company-info" style="color: #555; font-family: helvetica">Email: ${emailcompany}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
               
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin: 0px auto; max-width: 600px">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%">
          <tbody>
            <tr>
              <td style="direction: ltr; font-size: 0px; padding: 20px 0; padding-top: 5px; text-align: center">
               
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align: top" width="100%">
                    <tbody>
                      <tr>
                        <td align="left" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                          <table cellpadding="0" cellspacing="0" width="100%" border="0" style="color: #000000; font-family: Helvetica, Arial, sans-serif; font-size: 13px; line-height: 22px; table-layout: auto; width: 100%; border: none">
                            <tr>
                              <td style="max-width: 50%; width: 50%; border-bottom: 1px solid #777; padding: 0 0 10px 0; color: #333; font-family: helvetica"><strong>ITEM</strong></td>
                              <td style="border-bottom: 1px solid #777; padding: 0 0 10px 0; color: #333; font-family: helvetica; white-space: nowrap"><strong>QTY</strong></td>
                              <td style="border-bottom: 1px solid #777; padding: 0 0 10px 0; color: #333; font-family: helvetica; white-space: nowrap" align="right"><strong>PRICE</strong></td>
                              <td style="border-bottom: 1px solid #777; padding: 0 0 10px 0; color: #333; font-family: helvetica; white-space: nowrap" align="right"><strong>SUBTOTAL</strong></td>
                            </tr>
                            ${itemsHtml}
                            <tr>
                              <td></td>
                              <td style="border-top: 1px solid #555; color: #555; padding: 10px 0; font-family: helvetica; border-bottom: 1px solid #ddd" align="left" colspan="2">Fee Shopping:</td>
                              <td style="border-top: 1px solid #555; color: #555; padding: 10px 0; font-family: helvetica; border-bottom: 1px solid #ddd; white-space: nowrap" align="right">${fee}</td>
                            </tr>
                            
                            <tr>
                              <td></td>
                              <td style="border-top: 1px solid #777; color: #333; padding: 10px 0 0 0; font-family: helvetica" align="left" colspan="2"><strong>Total:</strong></td>
                              <td style="border-top: 1px solid #777; color: #333; padding: 10px 0 0 0; font-family: helvetica; white-space: nowrap" align="right"><strong>${total}</strong></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
               
              </td>
            </tr>
          </tbody>
        </table>
        <div >
          <h3 class="toptext">looking for further help</h3>
          <p class="toptext">
            If you any question on your order,please contact +216${phonecompany} and ${emailcompany} check your order status online
          </p>
          </div>
      </div>
     
     
    </div>
  </body>
</html>

  `;
}
