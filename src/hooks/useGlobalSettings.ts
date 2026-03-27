import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "../store/UsersStore";
import { createGrade, deleteGrade, editGrade } from "../services/grade";
import { getGlobalSettings, sendGlobalSettings } from "../services/globalSettings";
import { GlobalSet } from "../types/GlobalSettings";

export const useGetGlobalSettings = () => {
    const setGlobalSettings = useUserStore((state) => state.setGlobalSettings)

    return useMutation({
        mutationFn: (country_id: string) => getGlobalSettings(country_id),
        onSuccess: (data) => {
            setGlobalSettings(data)
            console.log(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};


export const useSetGlobalSettings = () => {
    const setGlobalSettings = useUserStore((state) => state.setGlobalSettings)

    return useMutation({
        mutationFn: ({ country_id, globalSet }: { country_id: string, globalSet: GlobalSet }) => sendGlobalSettings(country_id, globalSet),
        onSuccess: (data) => {
            setGlobalSettings(data)
            console.log(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};