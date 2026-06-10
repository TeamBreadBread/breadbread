package com.breadbread.global.aspect;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.temporal.Temporal;
import java.util.Collection;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindingResult;
import org.springframework.web.multipart.MultipartFile;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    @Around(
            "execution(* com.breadbread..service..*(..)) && !@annotation(org.springframework.scheduling.annotation.Async)")
    public Object logService(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = signature.getName();

        log.debug("[SERVICE] {}.{}() called", className, methodName);
        long start = System.currentTimeMillis();

        Object result = joinPoint.proceed();
        long elapsed = System.currentTimeMillis() - start;

        if (elapsed > 2000) {
            log.warn("[SERVICE] {}.{}() - slow response: {}ms", className, methodName, elapsed);
        } else {
            log.debug("[SERVICE] {}.{}() - completed in {}ms", className, methodName, elapsed);
        }

        return result;
    }

    @Around("@annotation(org.springframework.scheduling.annotation.Async)")
    public Object logAsync(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = signature.getName();
        long submittedAt = System.currentTimeMillis();

        log.info("[ASYNC] {}.{}() started", className, methodName);

        try {
            Object result = joinPoint.proceed();

            if (result instanceof CompletableFuture<?> future) {
                future.whenComplete(
                        (value, ex) -> {
                            long completedAt = System.currentTimeMillis();
                            long elapsed = completedAt - submittedAt;
                            if (ex != null) {
                                log.warn(
                                        "[ASYNC] {}.{}() failed after {}ms (submitted at {}) | {}",
                                        className,
                                        methodName,
                                        elapsed,
                                        submittedAt,
                                        ex.getMessage());
                            } else {
                                log.info(
                                        "[ASYNC] {}.{}() completed in {}ms (submitted at {})",
                                        className,
                                        methodName,
                                        elapsed,
                                        submittedAt);
                            }
                        });
            } else {
                long elapsed = System.currentTimeMillis() - submittedAt;
                log.info(
                        "[ASYNC] {}.{}() completed in {}ms (submitted at {})",
                        className,
                        methodName,
                        elapsed,
                        submittedAt);
            }

            return result;
        } catch (Throwable e) {
            long elapsed = System.currentTimeMillis() - submittedAt;
            log.warn(
                    "[ASYNC] {}.{}() failed after {}ms (submitted at {}) | {} : {}",
                    className,
                    methodName,
                    elapsed,
                    submittedAt,
                    e.getClass().getSimpleName(),
                    e.getMessage());
            throw e;
        }
    }

    @Around("execution(* com.breadbread..controller..*(..))")
    public Object logController(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = signature.getName();
        String[] paramNames = signature.getParameterNames();
        Object[] paramValues = joinPoint.getArgs();

        StringBuilder params = new StringBuilder();
        for (int i = 0; i < paramValues.length; i++) {
            String paramName =
                    paramNames != null && i < paramNames.length ? paramNames[i] : "arg" + i;
            if (i > 0) params.append(", ");
            params.append(paramName).append("=").append(formatParam(paramName, paramValues[i]));
        }

        long start = System.currentTimeMillis();
        try {
            return joinPoint.proceed();
        } finally {
            long elapsed = System.currentTimeMillis() - start;
            log.info(
                    "[CONTROLLER] {}.{}({}) - {}ms",
                    className,
                    methodName,
                    params.isEmpty() ? "" : params.toString(),
                    elapsed);
        }
    }

    private String formatParam(String paramName, Object param) {
        if (param == null) {
            return "null";
        }
        if (isSensitiveKey(paramName)) {
            return "***";
        }
        if (param instanceof HttpServletRequest) {
            return "HttpServletRequest";
        }
        if (param instanceof HttpServletResponse) {
            return "HttpServletResponse";
        }
        if (param instanceof BindingResult bindingResult) {
            return "BindingResult(errors=" + bindingResult.getErrorCount() + ")";
        }
        if (param instanceof MultipartFile multipartFile) {
            return "MultipartFile(name="
                    + multipartFile.getName()
                    + ", size="
                    + multipartFile.getSize()
                    + ")";
        }
        if (param instanceof Collection<?> collection) {
            return param.getClass().getSimpleName() + "(size=" + collection.size() + ")";
        }
        if (param instanceof Map<?, ?> map) {
            return "Map(size=" + map.size() + ")";
        }
        if (param != null && param.getClass().isArray()) {
            return param.getClass().getComponentType().getSimpleName() + "[]";
        }
        if (isComplexObject(param)) {
            return param.getClass().getSimpleName();
        }

        String str = param.toString();
        if (str.length() > 500) {
            return "[Too Large to Log]";
        }
        str = maskSensitiveFields(str);
        return str.length() > 200 ? str.substring(0, 200) + "..." : str;
    }

    private boolean isComplexObject(Object param) {
        Class<?> type = param.getClass();
        Package paramPackage = type.getPackage();
        if (type.isPrimitive()
                || param instanceof Number
                || param instanceof CharSequence
                || param instanceof Boolean
                || param instanceof Enum
                || param instanceof Temporal) {
            return false;
        }
        return paramPackage != null && paramPackage.getName().startsWith("com.breadbread");
    }

    private boolean isSensitiveKey(String key) {
        if (key == null) {
            return false;
        }
        String normalized = key.toLowerCase(Locale.ROOT);
        return normalized.contains("password")
                || normalized.contains("phone")
                || normalized.contains("code")
                || normalized.contains("token")
                || normalized.contains("secret")
                || normalized.contains("authorization");
    }

    private String maskSensitiveFields(String value) {
        return value.replaceAll(
                "(?i)(password|phone|code|token|secret|authorization)=([^,)}\\]]+)", "$1=***");
    }
}
