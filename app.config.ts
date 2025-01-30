export default defineAppConfig({
    ui: {
        primary: 'blue',
        gray: 'slate',
        input: {
            default: {
                color: 'gray',
                size: 'md',
            }
        },
        select: {
            default: {
                color: 'gray',
                size: 'md',
            }
        },
        modal: {
            background: 'bg-slate-50 dark:bg-slate-700',
            overlay: {
                background: 'bg-slate-200/75 dark:bg-slate-800/75'
            }
        },
        button: {
            default: {
                size: 'md',
            }
        }
    }
});