import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import PaletteIcon from '@mui/icons-material/Palette';

const items = [
    {
        Icon: <SecurityIcon sx={{color: 'text.secondary'}}/>,
        Title: 'Privacy First',
        Description: 'Your conversations are safe with us—secure encryption ensures your messages stay yours.'
    },
    {
        icon: <SpeedIcon sx={{color: 'text.secondary'}}/>,
        title: 'Low Latency, High Performance',
        description: "Lightning-fast voice and text ensure you're always a step ahead, no lag, no delays."
    },
    {
        icon: <SportsEsportsIcon sx={{color: 'text.secondary'}}/>,
        title: 'Made for Gamers',
        description: 'Squad up, strategize, and dominate—seamless voice and chat keep you in sync during every match.'
    },
    {
        icon: <PaletteIcon sx={{color: 'text.secondary'}}/>,
        title: 'Make It Yours',
        description: 'Customize your experience with themes, roles, and notifications tailored to your style.'
    },
];

export default function Content() {
    return (
        <Stack
            sx={{
                flexDirection: 'column', alignSelf: 'center', gap: 3, maxWidth: 450,
            }}
        >
            {items.map((item, index) => (
                <Stack key={index} direction="row" sx={{gap: 3}}>
                    {item.icon}
                    <div>
                        <Typography gutterBottom sx={{fontWeight: 'medium'}}>
                            {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{color: 'text.secondary'}}>
                            {item.description}
                        </Typography>
                    </div>
                </Stack>
            ))}
        </Stack>
    );
}
