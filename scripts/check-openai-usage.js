require('dotenv').config();

async function checkOpenAIUsage() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY not found in .env file');
    process.exit(1);
  }

  // Mask the key for security
  const maskedKey = `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;
  console.log(`🔑 Checking usage for API key: ${maskedKey}\n`);

  try {
    // First, verify the key is valid
    console.log('🔍 Verifying API key...');
    const modelsResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!modelsResponse.ok) {
      const errorData = await modelsResponse.json().catch(() => ({}));
      console.error('❌ API key validation failed');
      console.error(`Status: ${modelsResponse.status} ${modelsResponse.statusText}`);
      console.error('Error:', errorData);
      process.exit(1);
    }

    console.log('✅ API key is valid!\n');

    // Try to get usage information
    // Note: OpenAI's usage endpoint requires organization-level access
    console.log('📊 Attempting to fetch usage data...\n');
    
    // Get current date and start of month for usage query
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    const usageUrl = `https://api.openai.com/v1/usage?date=${formatDate(startDate)}`;
    
    const usageResponse = await fetch(usageUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (usageResponse.ok) {
      const usageData = await usageResponse.json();
      console.log('💰 Usage Information:');
      console.log(JSON.stringify(usageData, null, 2));
    } else {
      console.log('ℹ️  Usage endpoint not accessible with this API key.');
      console.log('   (This is normal for user-level API keys)\n');
    }

    // Try subscription/billing endpoint
    console.log('💳 Checking subscription information...\n');
    const subscriptionResponse = await fetch('https://api.openai.com/v1/dashboard/billing/subscription', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (subscriptionResponse.ok) {
      const subscriptionData = await subscriptionResponse.json();
      console.log('✅ Subscription Information:');
      console.log(JSON.stringify(subscriptionData, null, 2));
    } else {
      console.log('ℹ️  Subscription endpoint not accessible with this API key.\n');
    }

    // Important note
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 NOTE: To check your detailed usage and billing:');
    console.log('   1. Visit: https://platform.openai.com/usage');
    console.log('   2. Login with your OpenAI account');
    console.log('   3. View your usage dashboard and remaining credits');
    console.log('\n💡 API keys typically don\'t have direct access to billing data');
    console.log('   for security reasons. Check the dashboard for accurate info.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error checking OpenAI usage:');
    console.error(error.message);
    process.exit(1);
  }
}

checkOpenAIUsage();
