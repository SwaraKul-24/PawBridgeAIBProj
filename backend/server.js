const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Test database connection before starting server
async function startServer() {
  try {
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║              🐾 PawBridge API Server 🐾              ║
║                                                       ║
║  Status: Running                                      ║
║  Port: ${PORT}                                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║  Phase: 1 (Local Development)                        ║
║                                                       ║
║  Health Check: http://localhost:${PORT}/health        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
