import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { styled } from "@mui/material/styles";
import { TextField } from "@mui/material";

const CustomDatePicker = styled(DatePicker)(({ theme }) => ({
    "& .MuiPaper-root": {
        // Manual dark/light theme background
        backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#ffffff",
    },
    "& .MuiPickersDay-root": {
        borderRadius: "4px", // Ensures rectangular shape
    },
    "& .MuiPickersDay-root.Mui-selected": {
        borderRadius: "4px",
        border: "2px solid",
        borderColor: theme.palette.primary.main,
        backgroundColor: "transparent",
    },
    "& .MuiPickersDay-root:hover, & .MuiPickersDay-root.Mui-selected:hover": {
        borderRadius: "4px",
        backgroundColor: theme.palette.mode === "dark"
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)", // Ensures rectangular hover effect
    },
}));

const CustomDatePickerComponent = () => {
    return (
        <CustomDatePicker
            slots={{ textField: (params) => <TextField {...params} fullWidth /> }}
        />
    );
};

export default CustomDatePickerComponent;
