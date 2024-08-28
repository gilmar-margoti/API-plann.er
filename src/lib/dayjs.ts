import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import 'dayjs/locale/en-GB';

dayjs.locale('en-GB');
dayjs.extend(localizedFormat);

export { dayjs }
