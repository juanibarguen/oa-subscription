const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const CLIENT_ID = 'ASZO_fqJMSFWWCIvpfDeB2EEbumdOMRlDX4uQIZRDtVufx1yt3xxRzNjJ7pGrMf3lfdCaJM0kIVXCBJX';
const CLIENT_SECRET = 'EK_Hsx5hHQPYf0Udb6POgmvLp86P_G9FCqbpRnJtoriCGr13pp4Vem98jjekQ2pQ4Uj7c99wksyoEhK2';
const PORT = 3000;

let planIds = {};

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

async function createProduct(name, description) {
  try {
    const accessToken = await getAccessToken();
    const productData = {
      name: name,
      description: description,
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

    console.log(`${name} product created:`, response.data);
    return response.data.id;
  } catch (error) {
    console.error(`Error creating ${name} product:`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to create ${name} product`);
  }
}

let ungatedPlanId;
let mixtaPlanId;
let exclusivePlanId;


async function createPlan(productId, name, description, price1, price2) {
  try {
    const accessToken = await getAccessToken();
    
    const planData = {
      product_id: productId,
      name: name,
      description: description,
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
              value: price1,
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
          pricing_scheme: {
            fixed_price: {
              value: price2,
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

    //console.log('Plan created:', response.data);
    
    // Almacenar el ID del plan en la variable correspondiente según el nombre del plan
    if (name.toLowerCase().includes('ungated')) {
      ungatedPlanId = response.data.id;
      console.log(ungatedPlanId);
    } else if (name.toLowerCase().includes('mixta')) {
      mixtaPlanId = response.data.id;
      console.log(mixtaPlanId);
    } else if (name.toLowerCase().includes('exclusive')) {
      exclusivePlanId = response.data.id;
      console.log(exclusivePlanId);
    }
    
    //return response.data.id; // Devolver el ID del plan
  } catch (error) {
    console.error('Error creating plan:', error.response ? error.response.data : error.message);
    throw new Error('Failed to create plan');
  }
}







async function initializeProducts() {
  try {
    const ungatedProductId = await createProduct("Ungated", "Un servicio de listas");
    const mixtaProductId = await createProduct("Mixta", "Un servicio de listas Mixta");
    const exclusiveProductId = await createProduct("Exclusive", "Un servicio de listas Exclusive");
    
    // Crear los planes correspondientes y almacenar sus IDs
    const ungatedPlan = await createPlan(ungatedProductId, "Ungated Plan", "Plan de suscripción para Ungated", "50.00", "75.00");
    const mixtaPlan = await createPlan(mixtaProductId, "Mixta Plan", "Plan de suscripción para Mixta", "75.00", "100.00");
    const exclusivePlan = await createPlan(exclusiveProductId, "Exclusive Plan", "Plan de suscripción para Exclusive", "100.00", "120.00");
    
    console.log('All products and plans created successfully');
    
    // Almacenar los IDs de los planes
    planIds = { ungatedPlan, mixtaPlan, exclusivePlan };
    
    return { ungatedProductId, mixtaProductId, exclusiveProductId };
  } catch (error) {
    console.error('Error initializing products and plans:', error);
    throw new Error('Failed to initialize products and plans');
  }
}

// Llamar a initializeProducts() al iniciar el servidor
initializeProducts().catch(err => {
  console.error("Failed to initialize products and plans on startup:", err);
});

// Manejador de la ruta '/success'
app.get('/success', (req, res) => {
  res.send('<h1>Gracias por tu pago</h1><p>Tu suscripción ha sido creada con éxito.</p>');
});

// Manejador de la ruta '/cancel'
app.get('/cancel', (req, res) => {
  res.send('<h1>Pago cancelado</h1><p>Lo sentimos, tu suscripción no ha sido completada.</p>');
});




// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});




// Modificar la ruta /subscribe/:planId para usar createSubscription

app.post('/subscribe/:planId', async (req, res) => {
  const { planId } = req.params;
  const { userEmail } = req.body;

  try {
    const subscriptionResponse = await createSubscription(planId, userEmail);
    res.json(subscriptionResponse);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create PayPal subscription' });
  }
});




// Función para crear una suscripción
async function createSubscription(planId, firstName, lastName, email) {
  try {
    const accessToken = await getAccessToken();

    const subscriptionData = {
      plan_id: planId,
      subscriber: {
        email_address: email,
        name: {
          given_name: firstName,
          surname: lastName
        }
      },
      application_context: {
        brand_name: 'OA Snipers',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel'
      }
    };

    const response = await axios.post('https://api-m.sandbox.paypal.com/v1/billing/subscriptions', subscriptionData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error creating subscription:', error.response ? error.response.data : error.message);
    throw new Error('Failed to create subscription');
  }
}



// Ruta para manejar la suscripción del plan Mixta
app.post('/subscribe-mixta', async (req, res) => {
  const { firstName, lastName, email } = req.body;

  try {
    const subscriptionResponse = await createSubscription(mixtaPlanId, firstName, lastName, email);
    res.json({ approvalUrl: subscriptionResponse.links.find(link => link.rel === 'approve').href });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create PayPal subscription' });
  }
});


app.post('/subscribe-ungated', async (req, res) => {
  const { firstName, lastName, email } = req.body;

  try {
    const subscriptionResponse = await createSubscription(ungatedPlanId, firstName, lastName, email);
    res.json({ approvalUrl: subscriptionResponse.links.find(link => link.rel === 'approve').href });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create PayPal subscription' });
  }
});



// Ruta para manejar la suscripción del plan Mixta
app.post('/subscribe-exclusive', async (req, res) => {
  const { firstName, lastName, email } = req.body;

  try {
    const subscriptionResponse = await createSubscription(exclusivePlanId, firstName, lastName, email);
    res.json({ approvalUrl: subscriptionResponse.links.find(link => link.rel === 'approve').href });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create PayPal subscription' });
  }
});