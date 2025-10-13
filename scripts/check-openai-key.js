require('dotenv').config();

async function checkOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY not found in .env file');
    process.exit(1);
  }

  // Mask the key for security (show first 7 and last 4 characters)
  const maskedKey = `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;
  console.log(`🔑 Testing API key: ${maskedKey}\n`);

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API key validation failed');
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error('Error:', errorData);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ API key is valid!\n');
    console.log(`📋 Available models: ${data.data.length} models found`);
    console.log('\nSome available models:');
    data.data.slice(0, 5).forEach((model) => {
      console.log(`  - ${model.id}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error connecting to OpenAI API:');
    console.error(error.message);
    process.exit(1);
  }
}

checkOpenAIKey();
