const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const CLIENT_ID = 'ASZO_fqJMSFWWCIvpfDeB2EEbumdOMRlDX4uQIZRDtVufx1yt3xxRzNjJ7pGrMf3lfdCaJM0kIVXCBJX';
const CLIENT_SECRET = 'EK_Hsx5hHQPYf0Udb6POgmvLp86P_G9FCqbpRnJtoriCGr13pp4Vem98jjekQ2pQ4Uj7c99wksyoEhK2';
const PORT = 3000;

const app = express();

app.use(bodyParser.json());
app.use(express.static('public')); // Servir archivos estáticos desde la carpeta 'public'

async function getAccessToken() {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: CLIENT_ID,
        password: CLIENT_SECRET,
      },
      data: 'grant_type=client_credentials',
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error obtaining access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to obtain access token');
  }
}

async function createProduct() {
  try {
    const accessToken = await getAccessToken();
    const productData = {
      name: "Ungated",
      description: "Un servicio de listas",
      type: "SERVICE",
      category: "SOFTWARE"
    };

    const response = await axios({
      method: 'post',
      url: 'https://api-m.sandbox.paypal.com/v1/catalogs/products',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `request-${Math.random()}`,
      },
      data: productData,
    });

    console.log('Product created:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('Error creating product:', error.response ? error.response.data : error.message);
    throw new Error('Failed to create product');
  }
}

async function createPlan(productId) {
  try {
    const accessToken = await getAccessToken();
    
    const planData = {
        product_id: productId,
        name: "Ungated",
        description: "Un plan de suscripción para el servicio Ungated",
        billing_cycles: [
          {
            frequency: {
              interval_unit: "MONTH",
              interval_count: 1
            },
            tenure_type: "TRIAL",
            sequence: 1,
            total_cycles: 1,
            pricing_scheme: {
              fixed_price: {
                value: "49.99",
                currency_code: "USD"
              }
            }
          },
          {
            frequency: {
              interval_unit: "MONTH",
              interval_count: 1
            },
            tenure_type: "REGULAR",
            sequence: 2,
            // Se omite total_cycles o se establece en 0 para duración indefinida
            pricing_scheme: {
              fixed_price: {
                value: "74.99",
                currency_code: "USD"
              }
            }
          }
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: "0",
            currency_code: "USD"
          },
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3
        },
        taxes: {
          percentage: "0",
          inclusive: false
        }
      };
      

    const response = await axios({
      method: 'post',
      url: 'https://api-m.sandbox.paypal.com/v1/billing/plans',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `request-${Math.random()}`,
      },
      data: planData,
    });

    console.log('Plan created:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('Error creating plan:', error.response ? error.response.data : error.message);
    throw new Error('Failed to create plan');
  }
}


app.get('/ungated.html', async (req, res) => {
  try {
    const productId = await createProduct();
    const planId = await createPlan(productId);
    res.sendFile(path.join(__dirname, 'public', 'ungated.html'), { planId }); // Enviar planId junto con el archivo
  } catch (error) {
    res.status(500).send('Error obteniendo el ID del plan');
  }
});


app.post('/createSubscription', async (req, res) => {
  const { plan_id, subscriber } = req.body;
  
  try {
    const accessToken = await getAccessToken();
    const subscriptionData = {
      plan_id: plan_id,
      subscriber: subscriber,
      application_context: {
        brand_name: "Ungated",
        locale: "en-US",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
        },
        return_url: "http://localhost:3000/success", // Cambia esto a tu URL de éxito
        cancel_url: "http://localhost:3000/cancel"   // Cambia esto a tu URL de cancelación
      }
    };

    const response = await axios.post('https://api.sandbox.paypal.com/v1/billing/subscriptions', subscriptionData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `request-${Math.random()}`,
      },
    });

    const redirect_url = response.data.links.find(link => link.rel === 'approve').href;
    res.status(200).json({ redirect_url }); // Devolver la URL de redirección a PayPal al cliente
  } catch (error) {
    console.error('Error creating subscription:', error.response ? error.response.data : error.message);
    res.status(500).send('Error creating subscription');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
