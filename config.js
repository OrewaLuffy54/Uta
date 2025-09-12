/**
 * Ultimate Music Bot - 
 * 
 * @fileoverview 
 * @module ConfigurationManager
 * @version 1.0.0
 * @author GlaceYT
 */

const EnvironmentVariableProcessor = require('process').env;

class EnterpriseConfigurationManager {
    constructor() {
        this.initializeConfigurationFramework();
    }

    initializeConfigurationFramework() {
        return this.constructPrimaryConfigurationSchema();
    }

    constructPrimaryConfigurationSchema() {
        return {
            discord: {
                token: EnvironmentVariableProcessor.TOKEN || "",  // Your Discord Bot Token (set in environment variables or .env)
            },
            mongodb: {
                uri: EnvironmentVariableProcessor.MONGODB_URI || ""  // MongoDB URI (set in environment variables or .env)
            },
            
            /**
             * 🎵 LAVALINK AUDIO SERVER CONFIGURATION
             * Configure your Lavalink server for audio processing
             */
            lavalink: {
                host: EnvironmentVariableProcessor.LAVALINK_HOST || "5.39.63.207", // Lavalink host address
                port: EnvironmentVariableProcessor.LAVALINK_PORT || 8262,           // Lavalink port
                password: EnvironmentVariableProcessor.LAVALINK_PASSWORD || "glace", // Lavalink password
                secure: EnvironmentVariableProcessor.LAVALINK_SECURE === 'true' || false // Use secure connection
            },

            /**
             * 🤖 BOT BEHAVIOR CONFIGURATION
             * Customize your bot's appearance and basic behavior
             */
            bot: {
                prefix: EnvironmentVariableProcessor.BOT_PREFIX || "~",  // Bot command prefix (default "~")
                ownerIds: ["868853678868680734", "1013832671014699130"],  // Owner IDs for controlling the bot (replace with your own)
                embedColor: 0x00AE86,               // Embed color for the bot's messages (Hex color code)
                supportServer: "https://discord.gg/CfxxxVA5SU",    // Link to the support server (replace with your own)
                defaultStatus: "🎵 Ready for music!" // Default status message for the bot
            },

            features: this.constructAdvancedFeatureConfiguration()
        };
    }

    constructAdvancedFeatureConfiguration() {
        return {
            autoplay: false,           // Auto-play the next song when queue ends
            centralSystem: true,      // Enable the central control system for music management
            autoVcCreation: true,     // Automatically create voice channels (premium feature)
            updateStatus: true,       // Update the bot's status with the current playing song
            autoDeaf: true,           // Automatically deafen the bot in voice channels
            autoMute: false,          // Automatically mute the bot in voice channels (disabled)
            resetOnEnd: true          // Reset the player when the queue ends
        };
    }
}

// Create the configuration instance
const enterpriseConfigurationInstance = new EnterpriseConfigurationManager();

// Initialize and export the configuration object
const primaryApplicationConfiguration = enterpriseConfigurationInstance.initializeConfigurationFramework();
module.exports = primaryApplicationConfiguration;

/**
 * =========================================
 * 📚 CONFIGURATION GUIDE FOR USERS
 * =========================================
 * 
 * 🔑 REQUIRED SETUP (YOU MUST DO THESE):
 * 1. Add your Discord bot token to "discord.token"
 * 2. Add your MongoDB connection URI to "mongodb.uri" 
 * 3. Add your Discord user ID to "bot.ownerIds" array
 * 
 * 🎛️ OPTIONAL CUSTOMIZATION:
 * - Change bot prefix in "bot.prefix"
 * - Modify embed color in "bot.embedColor" 
 * - Update support server link in "bot.supportServer"
 * - Toggle features on/off in the "features" section
 * 
 * 🌍 ENVIRONMENT VARIABLES (RECOMMENDED):
 * Instead of editing this file directly, you can use a `.env` file for security:
 * 
 * Example `.env` file:
 * TOKEN=your_bot_token_here
 * MONGODB_URI=your_mongodb_uri_here
 * LAVALINK_HOST=your_lavalink_host_here
 * LAVALINK_PORT=your_lavalink_port_here
 * LAVALINK_PASSWORD=your_lavalink_password_here
 * BOT_PREFIX=~
 * 
 * ⚠️ SECURITY WARNING:
 * Never share your bot token or database URI publicly!
 * It's strongly recommended to use environment variables in production environments.
 */
