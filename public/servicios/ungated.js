const subscriptionForm = document.getElementById('subscriptionForm');
const planId = document.getElementById('planId').value;



subscriptionForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(subscriptionForm);
  const subscriber = {
    name: {
      given_name: formData.get('firstName'),
      surname: formData.get('lastName')
    },
    email_address: formData.get('email')
  };

  try {
  // Modifica la solicitud de creación de suscripción para enviar el planId
const response = await axios.post('http://localhost:3000/createSubscription', {
  plan_id: planId, // Utiliza el planId obtenido del campo oculto
  subscriber: subscriber
});

    console.log('Subscription created:', response.data);
    window.location.href = response.data.redirect_url; // Redirigir al usuario a PayPal
  } catch (error) {
    console.error('Error creating subscription:', error.response ? error.response.data : error.message);
    alert('Error al crear la suscripción. Por favor, inténtalo de nuevo más tarde.');
  }
});
