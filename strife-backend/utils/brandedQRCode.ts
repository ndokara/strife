import qrcode from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export const generateBrandedQRCode = async (otpAuthUrl: string): Promise<string> => {
    const qrBuffer: Buffer<ArrayBufferLike> = await qrcode.toBuffer(otpAuthUrl, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 1,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    });

    const svgPath: string = path.join(__dirname, '../assets/strife_logo_round_bw.svg');
    const svgContent: string = await fs.readFile(svgPath, 'utf8');

    const logoBuffer:Buffer<ArrayBufferLike> = await sharp(Buffer.from(svgContent))
        .resize(80, 80)
        .png()
        .toBuffer();

    const qrWithLogo:Buffer<ArrayBufferLike> = await sharp(qrBuffer)
        .composite([
            {
                input: logoBuffer,
                top: 160,
                left: 160,
            },
        ])
        .png()
        .toBuffer();

    return `data:image/png;base64,${qrWithLogo.toString('base64')}`;
};
