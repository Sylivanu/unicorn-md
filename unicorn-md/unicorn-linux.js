import { exec } from 'child_process';

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  const commandToRun = args.join(' ') || 'ls'; // Default to 'ls' if no command is provided

  try {
    await m.react('🧙‍♂️'); // Indicate spell is being cast

    exec(commandToRun, async (error, stdout, stderr) => {
      await m.react('✅'); // Spell completed

      if (error) {
        return m.reply(`❌ *Spell Failed!*\n📛 \`${error.message}\``);
      }

      if (stderr) {
        return m.reply(`⚠️ *Magic Warning!*\n📝 \`${stderr}\``);
      }

      const output = stdout.trim() || '🔮 No magical output returned.';
      return m.reply(`✨ *Command Output:*\n\`\`\`${output}\`\`\``);
    });

  } catch (err) {
    await m.react('❌');
    return m.reply(`💥 *Critical error while casting magic:*\n\`\`\`${err.message}\`\`\``);
  }
};

handler.help = ['linux <cmd>'];
handler.tags = ['tools'];
handler.command = ['linux', 'exec'];
handler.owner = true; // Only the bot owner can run system-level commands

export default handler;
