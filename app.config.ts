export default defineAppConfig({
    ui: {
        primary: 'orange',
        gray: 'slate',
        input: {
            default: {
                color: 'gray',
                size: 'md'
            }
        },
        select: {
            default: {
                color: 'gray',
            }
        },
        modal: {
            background: 'bg-slate-50 dark:bg-slate-700',
            overlay: {
                background: 'bg-slate-200/75 dark:bg-slate-800/75'
            }
        },
        button: {
            rounded: 'rounded-lg',
            default: {
                size: 'md'
            }
        }
    }
});